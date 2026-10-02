import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { orderUrl } from "@/lib/order-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, orderStatusTemplate } from "@/lib/resend";

async function requireAdmin() {
  return checkAdmin(["super_admin", "order_manager"]);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  await admin.from("orders").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", id);
  await admin.from("order_status_history").insert({ order_id: id, status: body.status, note: body.note || null, changed_by: g.user.id });

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
