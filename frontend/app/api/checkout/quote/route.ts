import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShippingSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateCoupon, computeTotals } from "@/lib/coupons";

// Price preview for the checkout page. Uses the same totals + coupon rules as
// /api/orders/create, so what the customer sees is what they are charged.
export async function POST(req: Request) {
  const { subtotal: rawSubtotal, coupon_code, email } = await req.json();
  const subtotal = Math.max(0, Number(rawSubtotal) || 0);
  const s = await getShippingSettings();

  let discount = 0;
  let coupon: { code: string } | null = null;
  let coupon_error: string | null = null;
  if (typeof coupon_code === "string" && coupon_code.trim()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const r = await evaluateCoupon(createAdminClient(), coupon_code, subtotal, {
      userId: user?.id,
      email: typeof email === "string" ? email : null,
    });
    if (r.ok) {
      discount = r.discount;
      coupon = { code: r.coupon.code };
    } else {
      coupon_error = r.error;
    }
  }

  const t = computeTotals(subtotal, discount, s);
  return NextResponse.json({ ...t, coupon, coupon_error });
}
