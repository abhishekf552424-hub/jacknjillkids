import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await checkAdmin();
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await params;
  const { status } = await req.json();
  if (!["approved", "rejected", "in_progress"].includes(status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });

  const admin = createAdminClient();
  const { data: r } = await admin.from("returns").select("*, order:orders(order_number, shipping_address)").eq("id", id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("returns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

  // On approval of a size exchange: old size back on the shelf, new size out.
  // Only on the first approval, and atomically (adjust_stock in migration 0011).
  if (status === "approved" && r.status !== "approved" && r.type === "size_exchange" && r.variant_id && r.exchange_variant_id) {
    await admin.rpc("adjust_stock", { p_variant_id: r.variant_id, p_delta: 1 });
    await admin.rpc("adjust_stock", { p_variant_id: r.exchange_variant_id, p_delta: -1 });
  }

  const email = r.order?.shipping_address?.email;
  if (email) {
    await sendEmail({
      to: email,
      subject: `Your ${r.type === "size_exchange" ? "exchange" : "return"} request for ${r.order?.order_number} is ${status}`,
      html: `<p>Your request for order <strong>${r.order?.order_number}</strong> has been <strong>${status}</strong>.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
