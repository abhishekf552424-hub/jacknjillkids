import type { SupabaseClient } from "@supabase/supabase-js";

export type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  min_cart_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
};

export type CouponResult =
  | { ok: true; coupon: CouponRow; discount: number }
  | { ok: false; error: string };

/** Discount in whole rupees for a cart subtotal (never more than the subtotal). */
export function computeDiscount(c: Pick<CouponRow, "type" | "value" | "max_discount">, subtotal: number): number {
  let d = c.type === "percent" ? (subtotal * Number(c.value)) / 100 : Number(c.value);
  if (c.max_discount != null && Number(c.max_discount) > 0) d = Math.min(d, Number(c.max_discount));
  d = Math.min(d, subtotal);
  return Math.max(0, Math.round(d));
}

/**
 * Server-side coupon validation. Uses the service-role client so customers
 * cannot read usage data. Per-customer limits match on account id or, for
 * guests, on the checkout email.
 */
export async function evaluateCoupon(
  admin: SupabaseClient,
  rawCode: string,
  subtotal: number,
  who: { userId?: string | null; email?: string | null },
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code" };
  if (!/^[A-Z0-9-]{2,40}$/.test(code)) return { ok: false, error: "This coupon is not valid" };

  const { data: c } = await admin.from("coupons").select("*").eq("code", code).maybeSingle();
  const coupon = c as CouponRow | null;
  if (!coupon || !coupon.is_active) return { ok: false, error: "This coupon is not valid" };

  const now = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) return { ok: false, error: "This coupon is not active yet" };
  if (coupon.valid_to && new Date(coupon.valid_to).getTime() < now) return { ok: false, error: "This coupon has expired" };

  const min = Number(coupon.min_cart_value || 0);
  if (subtotal < min) return { ok: false, error: `Add items worth ₹${Math.ceil(min - subtotal)} more to use ${coupon.code}` };

  if (coupon.usage_limit != null) {
    const { count } = await admin.from("coupon_usages").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id);
    if ((count ?? 0) >= coupon.usage_limit) return { ok: false, error: "This coupon has been fully used" };
  }

  if (coupon.per_user_limit != null && coupon.per_user_limit > 0) {
    let q = admin.from("orders").select("id", { count: "exact", head: true }).eq("coupon_code", coupon.code).neq("status", "cancelled");
    if (who.userId) q = q.eq("user_id", who.userId);
    else if (who.email) q = q.eq("guest_email", who.email.trim().toLowerCase());
    else q = q.eq("id", "00000000-0000-0000-0000-000000000000");
    const { count } = await q;
    if ((count ?? 0) >= coupon.per_user_limit) return { ok: false, error: "You have already used this coupon" };
  }

  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) return { ok: false, error: "This coupon does not apply to your cart" };
  return { ok: true, coupon, discount };
}

/** Shared totals so the checkout preview and the placed order always agree. */
export function computeTotals(
  subtotal: number,
  discount: number,
  s: { free_above: number; flat_fee: number; gst_percent: number },
) {
  const shipping = subtotal >= s.free_above ? 0 : s.flat_fee;
  const taxable = Math.max(0, subtotal - discount) + shipping;
  const tax = Math.round(taxable * (s.gst_percent / 100));
  const total = taxable + tax;
  return { subtotal, discount, shipping, tax, total };
}
