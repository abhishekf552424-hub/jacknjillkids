import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { checkAdmin } from "@/lib/admin-auth";
import { orderUrl } from "@/lib/order-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, orderStatusTemplate } from "@/lib/resend";

const VALID_STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "return_approved", "refunded"];

async function requireAdmin() {
  return checkAdmin("orders");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (typeof body.note === "string") body.note = body.note.slice(0, 500);
  if (!VALID_STATUSES.includes(body.status)) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  const admin = createAdminClient();
  const { data: before } = await admin.from("orders").select("status, order_number, shipping_address, guest_email").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  // Un-cancelling must take the stock again; refuse if it has sold out meanwhile.
  if (before?.status === "cancelled" && body.status !== "cancelled") {
    const { data: ok } = await admin.rpc("reclaim_order_stock", { p_order_id: id });
    if (ok !== true) return NextResponse.json({ ok: false, error: "Can't reopen: some items are now out of stock." }, { status: 409 });
  }
  const now = new Date().toISOString();
  const { error } = await admin
    .from("orders")
    .update({ status: body.status, updated_at: now, ...(body.status === "delivered" ? { delivered_at: now } : {}) })
    .eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "Could not update the order" }, { status: 400 });
  await admin.from("order_status_history").insert({ order_id: id, status: body.status, note: body.note || null, changed_by: g.user.id });
  // Cancelling puts the items back on the shelf (once — release_order_stock is idempotent).
  if (body.status === "cancelled") await admin.rpc("release_order_stock", { p_order_id: id });

  // The email always goes to the customer of THIS order (never to an address sent by the browser).
  const to = before.shipping_address?.email || before.guest_email;
  if ((body.notify || body.notify_email) && to) {
    sendEmail({
      to,
      subject: `Order ${before.order_number}: ${String(body.status).replace(/_/g, " ")}`,
      html: orderStatusTemplate({
        order_number: before.order_number,
        status_label: String(body.status).replace(/_/g, " "),
        tracking_url: orderUrl(before.order_number),
      }),
    }).catch(() => {});
  }
  refreshSite();
  return NextResponse.json({ ok: true });
}
