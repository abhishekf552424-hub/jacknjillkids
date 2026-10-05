import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { esc } from "@/lib/html";

export const runtime = "nodejs";

const Body = z.object({ status: z.enum(["approved", "rejected", "in_progress"]) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await checkAdmin("returns");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad status" }, { status: 400 });
  const { status } = parsed.data;

  const admin = createAdminClient();
  const { data: r } = await admin.from("returns").select("*, order:orders(order_number, shipping_address)").eq("id", id).maybeSingle();
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("returns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

  // Size exchange approved: old size back on the shelf, new size out — ONCE.
  // The stock_applied flag is claimed atomically, so approving twice (or two
  // staff clicking together) can't move stock twice.
  if (status === "approved" && r.type === "size_exchange" && r.variant_id && r.exchange_variant_id) {
    const { data: claimed } = await admin.from("returns").update({ stock_applied: true }).eq("id", id).eq("stock_applied", false).select("id");
    if (claimed?.length) {
      await admin.rpc("adjust_stock", { p_variant_id: r.variant_id, p_delta: 1 });
      await admin.rpc("adjust_stock", { p_variant_id: r.exchange_variant_id, p_delta: -1 });
    }
  }

  const email = r.order?.shipping_address?.email;
  if (email && status !== "in_progress") {
    await sendEmail({
      to: email,
      subject: `Your ${r.type === "size_exchange" ? "exchange" : "return"} request for ${r.order?.order_number} is ${status}`,
      html: `<p>Your request for order <strong>${esc(r.order?.order_number)}</strong> has been <strong>${esc(status)}</strong>.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
