import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";

/** Product cards for a list of ids (used by the wishlist page). Public data only. */
export async function GET(req: Request) {
  const raw = (new URL(req.url).searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ids = raw.filter((id) => z.string().uuid().safeParse(id).success).slice(0, 100);
  if (!ids.length) return NextResponse.json({ products: [] });
  const { data, error } = await createPublicClient()
    .from("products")
    .select("id, slug, name, brand, base_price, mrp, status, is_featured, is_new_arrival, alt_text, images:product_images(url, alt_text, sort_order)")
    .in("id", ids)
    .in("status", ["active", "out_of_stock"]);
  if (error) return NextResponse.json({ products: [] }, { status: 500 });
  const order = new Map(ids.map((id, i) => [id, i]));
  const products = (data ?? [])
    .map((p: any) => ({ ...p, images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order) }))
    .sort((a: any, b: any) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return NextResponse.json({ products }, { headers: { "Cache-Control": "public, max-age=60" } });
}
