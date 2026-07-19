import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google Merchant / Shopping XML feed
function esc(s: any) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }

export async function GET() {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, name, slug, description, base_price, mrp, brand, gender, product_type, hsn_code, category:categories(name), images:product_images(url,sort_order), variants:product_variants(stock_qty)")
    .eq("status", "active")
    .limit(1000);

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const items = (products || []).map((p: any) => {
    const img = (p.images || []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url || "";
    const inStock = (p.variants || []).some((v: any) => (v.stock_qty || 0) > 0);
    return `
    <item>
      <g:id>${esc(p.id)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${esc((p.description || p.name).slice(0, 4000))}</g:description>
      <g:link>${esc(siteUrl + "/product/" + p.slug)}</g:link>
      <g:image_link>${esc(img)}</g:image_link>
      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${esc((Number(p.mrp) || Number(p.base_price)).toFixed(2))} INR</g:price>
      <g:sale_price>${esc(Number(p.base_price).toFixed(2))} INR</g:sale_price>
      <g:brand>${esc(p.brand || "Jack & Jill")}</g:brand>
      <g:condition>new</g:condition>
      <g:gender>${esc(p.gender || "unisex")}</g:gender>
      <g:age_group>kids</g:age_group>
      <g:product_type>${esc(p.category?.name || "Kids")}</g:product_type>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Jack &amp; Jill — Product Feed</title>
    <link>${esc(siteUrl)}</link>
    <description>Premium kids fashion &amp; baby essentials.</description>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" } });
}
