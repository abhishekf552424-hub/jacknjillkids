import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBackInStock } from "@/lib/back-in-stock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PER_PAGE = 50;

/** Stock list for owner and staff: one row per size/colour. */
export async function GET(req: Request) {
  const g = await checkAdmin("stock");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").replace(/[%_,()\\]/g, " ").trim().slice(0, 60);
  const filter = url.searchParams.get("filter");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const admin = createAdminClient();
  let query = admin
    .from("product_variants")
    .select("id, sku, size, color, stock_qty, product:products!inner(id, name, slug, status, images:product_images(url, sort_order))", { count: "exact" })
    .neq("product.status", "archived");

  if (q) {
    // Match the product name or the SKU.
    const { data: named } = await admin.from("products").select("id").ilike("name", `%${q}%`).limit(200);
    const ids = (named ?? []).map((p: any) => p.id);
    query = ids.length ? query.or(`sku.ilike.%${q}%,product_id.in.(${ids.join(",")})`) : query.ilike("sku", `%${q}%`);
  }
  if (filter === "low") query = query.lte("stock_qty", 5);
  if (filter === "out") query = query.lte("stock_qty", 0);

  const { data, count, error } = await query
    .order("stock_qty", { ascending: true })
    .order("id")
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = ((data ?? []) as any[]).map((v) => {
    const p = Array.isArray(v.product) ? v.product[0] : v.product;
    const img = [...(p?.images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null;
    return { id: v.id, sku: v.sku, size: v.size, color: v.color, stock: v.stock_qty, product: p?.name, product_id: p?.id, slug: p?.slug, status: p?.status, image: img };
  });
  return NextResponse.json({ rows, total: count ?? rows.length, page, perPage: PER_PAGE });
}

const Update = z.object({
  variant_id: z.string().uuid(),
  expected: z.number().int().min(-100000).max(100000),
  stock_qty: z.number().int().min(0, "Stock can't be below 0").max(100000),
});

/**
 * Set a new stock count. We apply the DIFFERENCE from what the person saw,
 * so an order placed while they were typing is not lost.
 */
export async function PATCH(req: Request) {
  const g = await checkAdmin("stock");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const parsed = Update.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid stock" }, { status: 400 });
  const { variant_id, expected, stock_qty } = parsed.data;
  const delta = stock_qty - expected;
  const admin = createAdminClient();
  if (delta === 0) {
    const { data } = await admin.from("product_variants").select("stock_qty").eq("id", variant_id).maybeSingle();
    return NextResponse.json({ ok: true, stock: data?.stock_qty ?? stock_qty });
  }
  const { data, error } = await admin.rpc("adjust_stock", { p_variant_id: variant_id, p_delta: delta });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data === null || data === undefined) return NextResponse.json({ error: "Size not found" }, { status: 404 });
  if (expected <= 0 && Number(data) > 0) {
    const { data: v } = await admin.from("product_variants").select("product_id").eq("id", variant_id).maybeSingle();
    if (v?.product_id) void notifyBackInStock(admin, v.product_id);
  }
  return NextResponse.json({ ok: true, stock: data });
}
