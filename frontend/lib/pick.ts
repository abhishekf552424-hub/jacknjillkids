/**
 * Columns the admin panel may set on each table. Anything else sent by the
 * browser (ids, created dates, hidden flags…) is dropped before saving.
 */
const EDITABLE = {
  products: ["name", "slug", "description", "short_description", "category_id", "gender", "brand", "base_price", "mrp", "status", "is_featured", "is_new_arrival", "meta_title", "meta_description", "alt_text", "size_chart_url", "product_type", "hsn_code", "eligible_coupon_codes"],
  categories: ["parent_id", "name", "slug", "image_url", "display_shape", "is_featured_in_menu", "sort_order", "is_active", "meta_title", "meta_description"],
  coupons: ["code", "type", "value", "min_cart_value", "max_discount", "usage_limit", "per_user_limit", "valid_from", "valid_to", "is_active", "highlighted_product_ids"],
  faqs: ["question", "answer", "page_context", "sort_order", "is_active"],
  trust_badges: ["icon", "label", "subtext", "sort_order", "is_active", "icon_type", "icon_url"],
  cms_pages: ["slug", "title", "content", "meta_title", "meta_description"],
} as const;

export type EditableTable = keyof typeof EDITABLE;

export function pickEditable(table: EditableTable, body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== "object") return out;
  for (const k of EDITABLE[table]) {
    if (k in (body as Record<string, unknown>)) out[k] = (body as Record<string, unknown>)[k];
  }
  return out;
}
