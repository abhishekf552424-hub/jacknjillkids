import type { SupabaseClient } from "@supabase/supabase-js";

type VariantInput = {
  id?: string;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  sku?: string | null;
  stock_qty?: number | string | null;
  price_override?: number | string | null;
  mrp_override?: number | string | null;
};

const num = (v: unknown) => (v === "" || v == null ? null : Number(v));

/**
 * Checks every size's own price/MRP before saving. Returns a plain-words
 * problem, or null when all is fine. A size with no price of its own uses
 * the product's selling price and MRP.
 */
export function variantPriceProblem(product: { base_price?: unknown; mrp?: unknown }, input: VariantInput[] | undefined): string | null {
  const base = Number(product.base_price);
  const mrp = Number(product.mrp);
  for (const v of (input ?? []).filter((x) => x.sku || x.size || x.color)) {
    const label = [v.size, v.color].filter(Boolean).join(" / ") || "One size";
    const po = num(v.price_override);
    const mo = num(v.mrp_override);
    if (po != null && !(po > 0)) return `${label}: the price must be more than ₹0 (leave it empty to use the product price).`;
    if (mo != null && !(mo > 0)) return `${label}: the MRP must be more than ₹0 (leave it empty to use the product MRP).`;
    const price = po ?? base;
    const m = mo ?? mrp;
    if (m > 0 && price > m) {
      return mo == null
        ? `${label}: price ₹${price} is more than the MRP ₹${m}. Add an MRP for this size too.`
        : `${label}: price ₹${price} is more than its MRP ₹${m}. Please check both.`;
    }
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves a product's variants WITHOUT changing the ids of variants that still exist.
 *
 * The old code deleted every variant and inserted new rows on each save, so
 * variant ids changed every time the admin clicked Save. That broke shoppers'
 * bags (cart lines point at variant ids), combo products (bundles point at
 * child variant ids) and the link from past orders to their variant.
 *
 * Now: rows with a known id are updated, new rows are inserted, and only rows
 * the admin actually removed are deleted.
 */
export async function syncProductVariants(admin: SupabaseClient, productId: string, input: VariantInput[] | undefined) {
  const rows = (input ?? []).filter((v) => v.sku || v.size || v.color);
  const clean = (v: VariantInput) => ({
    product_id: productId,
    size: v.size || null,
    color: v.color || null,
    color_hex: v.color_hex || null,
    sku: v.sku || null,
    stock_qty: Math.max(0, Math.floor(Number(v.stock_qty) || 0)),
    price_override: num(v.price_override),
    mrp_override: num(v.mrp_override),
  });

  const { data: existing, error: exErr } = await admin.from("product_variants").select("id").eq("product_id", productId);
  if (exErr) return { error: exErr.message };
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));

  const keepIds = new Set<string>();
  const toInsert: ReturnType<typeof clean>[] = [];
  for (const v of rows) {
    if (v.id && UUID.test(v.id) && existingIds.has(v.id)) {
      keepIds.add(v.id);
      const { error } = await admin.from("product_variants").update(clean(v)).eq("id", v.id).eq("product_id", productId);
      if (error) return { error: error.message };
    } else {
      toInsert.push(clean(v));
    }
  }
  if (toInsert.length) {
    const { error } = await admin.from("product_variants").insert(toInsert);
    if (error) return { error: error.message };
  }
  const removed = [...existingIds].filter((id) => !keepIds.has(id));
  if (removed.length) {
    const { error } = await admin.from("product_variants").delete().in("id", removed);
    if (error) return { error: error.message };
  }
  return { error: null as string | null };
}
