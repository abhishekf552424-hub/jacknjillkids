import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { orderUrl } from "@/lib/order-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, orderStatusTemplate } from "@/lib/resend";

const VALID_STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

async function requireAdmin() {
  return checkAdmin("orders");
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });

  const { ids, status } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: false, error: "No orders selected." }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: orders } = await admin.from("orders").select("id, order_number, shipping_address, status").in("id", ids);
  if (status !== "cancelled" && (orders ?? []).some((o: any) => o.status === "cancelled")) {
    return NextResponse.json({ ok: false, error: "Reopen cancelled orders one at a time, so stock can be checked." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("orders").update({ status, updated_at: now, ...(status === "delivered" ? { delivered_at: now } : {}) }).in("id", ids);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const historyRows = ids.map((id: string) => ({ order_id: id, status, note: "Bulk update", changed_by: g.user.id }));
  await admin.from("order_status_history").insert(historyRows);
  if (status === "cancelled") {
    for (const id of ids) await admin.rpc("release_order_stock", { p_order_id: id });
  }

  // Best-effort notification emails — never let a delivery failure block the bulk update itself.
  for (const o of orders ?? []) {
    const email = (o.shipping_address as any)?.email;
    if (!email) continue;
    sendEmail({
      to: email,
      subject: `Order ${o.order_number}: ${status.replace(/_/g, " ")}`,
      html: orderStatusTemplate({
        order_number: o.order_number,
        status_label: status.replace(/_/g, " "),
        tracking_url: orderUrl(o.order_number),
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
