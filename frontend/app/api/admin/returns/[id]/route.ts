import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || p.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status } = await req.json();
  if (!["approved", "rejected", "in_progress"].includes(status)) return NextResponse.json({ error: "Bad status" }, { status: 400 });

  const admin = createAdminClient();
  const { data: r } = await admin.from("returns").select("*, order:orders(order_number, shipping_address)").eq("id", id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("returns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

  // On approval of size exchange: swap stock (increment old variant, decrement new)
  if (status === "approved" && r.type === "size_exchange" && r.variant_id && r.exchange_variant_id) {
    // Fetch current stock and update
    const { data: old } = await admin.from("product_variants").select("stock_qty").eq("id", r.variant_id).maybeSingle();
    const { data: nu } = await admin.from("product_variants").select("stock_qty").eq("id", r.exchange_variant_id).maybeSingle();
    if (old) await admin.from("product_variants").update({ stock_qty: (old.stock_qty || 0) + 1 }).eq("id", r.variant_id);
    if (nu) await admin.from("product_variants").update({ stock_qty: Math.max(0, (nu.stock_qty || 0) - 1) }).eq("id", r.exchange_variant_id);
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
