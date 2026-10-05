import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z
  .object({
    product_id: z.string().uuid().optional(),
    product_variant_id: z.string().uuid().optional(),
    email: z.string().trim().toLowerCase().email("Please enter a valid email").max(120),
    phone: z.string().trim().regex(/^[0-9+\- ]{10,15}$/, "Please enter a valid phone number").optional().or(z.literal("")),
  })
  .refine((b) => b.product_id || b.product_variant_id, { message: "Missing product" });

/** "Notify me when it's back" — one pending alert per product per email. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  const b = parsed.data;
  const admin = createAdminClient();
  if (!(await allow(`notify:${clientIp(req)}`, 15, 3600, admin))) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  let productId = b.product_id ?? null;
  if (b.product_variant_id) {
    const { data: v } = await admin.from("product_variants").select("product_id").eq("id", b.product_variant_id).maybeSingle();
    if (!v) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    productId = v.product_id;
  }
  const { data: p } = await admin.from("products").select("id").eq("id", productId!).in("status", ["active", "out_of_stock"]).maybeSingle();
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { count } = await admin.from("stock_notifications").select("id", { count: "exact", head: true }).ilike("email", b.email).is("notified_at", null);
  if ((count ?? 0) >= 30) return NextResponse.json({ error: "Too many alerts for this email" }, { status: 429 });

  const { error } = await admin.from("stock_notifications").insert({
    product_id: productId,
    product_variant_id: b.product_variant_id ?? null,
    email: b.email,
    phone: b.phone || null,
  });
  if (error && error.code !== "23505") return NextResponse.json({ error: "Could not save. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
