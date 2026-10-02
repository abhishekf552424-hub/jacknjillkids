import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { orderUrl } from "@/lib/order-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, orderStatusTemplate } from "@/lib/resend";

const VALID_STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "return_approved", "refunded"];

async function requireAdmin() {
  return checkAdmin(["super_admin", "order_manager"]);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json();
  if (!VALID_STATUSES.includes(body.status)) return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  const admin = createAdminClient();
  const { data: before } = await admin.from("orders").select("status").eq("id", id).maybeSingle();
  // Un-cancelling must take the stock again; refuse if it has sold out meanwhile.
  if (before?.status === "cancelled" && body.status !== "cancelled") {
    const { data: ok } = await admin.rpc("reclaim_order_stock", { p_order_id: id });
    if (ok !== true) return NextResponse.json({ ok: false, error: "Can't reopen: some items are now out of stock." }, { status: 409 });
  }
  const { error } = await admin.from("orders").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  await admin.from("order_status_history").insert({ order_id: id, status: body.status, note: body.note || null, changed_by: g.user.id });
  // Cancelling puts the items back on the shelf (once — release_order_stock is idempotent).
  if (body.status === "cancelled") await admin.rpc("release_order_stock", { p_order_id: id });

  if (body.notify_email && body.order_number) {
    sendEmail({
      to: body.notify_email,
      subject: `Order ${body.order_number}: ${String(body.status).replace(/_/g, " ")}`,
      html: orderStatusTemplate({
        order_number: body.order_number,
        status_label: String(body.status).replace(/_/g, " "),
        tracking_url: orderUrl(body.order_number),
      }),
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
