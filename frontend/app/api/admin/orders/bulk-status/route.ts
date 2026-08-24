import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, orderStatusTemplate } from "@/lib/resend";

const VALID_STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "order_manager"].includes(p.role)) return { error: "Forbidden", status: 403 };
  return { user };
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
  const { data: orders } = await admin.from("orders").select("id, order_number, shipping_address").in("id", ids);

  const { error } = await admin.from("orders").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const historyRows = ids.map((id: string) => ({ order_id: id, status, note: "Bulk update", changed_by: g.user.id }));
  await admin.from("order_status_history").insert(historyRows);

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
        tracking_url: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${o.order_number}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
