import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Review = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  author_name: z.string().trim().min(2, "Please add your name").max(60),
  comment: z.string().trim().max(1000, "Please keep it under 1000 characters").optional().default(""),
});

const DAILY_LIMIT = 5;

/**
 * A signed-in customer writes a review. It stays hidden until the shop
 * approves it in Admin → Reviews. One review per product per customer.
 * "Verified buyer" is set when the customer has a paid / COD order for it.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in to write a review" }, { status: 401 });

  const parsed = Review.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check your review" }, { status: 400 });
  const { product_id, rating, author_name, comment } = parsed.data;

  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id").eq("id", product_id).in("status", ["active", "out_of_stock"]).maybeSingle();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: "You've written a lot of reviews today. Please try again tomorrow." }, { status: 429 });

  const { data: existing } = await admin.from("reviews").select("id").eq("product_id", product_id).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "You've already reviewed this product. Thank you!" }, { status: 409 });

  // Verified buyer: a paid or COD order (not cancelled) that contains this product.
  const { data: bought } = await admin
    .from("order_items")
    .select("id, o:orders!inner(user_id, status, payment_status), v:product_variants!inner(product_id)")
    .eq("o.user_id", user.id)
    .in("o.payment_status", ["paid", "cod"])
    .neq("o.status", "cancelled")
    .eq("v.product_id", product_id)
    .limit(1);

  const { error } = await admin.from("reviews").insert({
    product_id,
    user_id: user.id,
    author_name,
    rating,
    comment: comment || null,
    is_approved: false,
    is_verified: (bought ?? []).length > 0,
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You've already reviewed this product. Thank you!" }, { status: 409 });
    return NextResponse.json({ error: "Could not save your review" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
