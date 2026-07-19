import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { product_variant_id, email, phone } = await req.json();
  if (!product_variant_id || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("stock_notifications").insert({ product_variant_id, email, phone: phone || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
