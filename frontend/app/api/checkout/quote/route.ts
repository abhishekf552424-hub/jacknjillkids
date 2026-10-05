import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getShippingSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateCoupon, computeTotals } from "@/lib/coupons";
import { allow, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  lines: z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).max(50).optional(),
  subtotal: z.number().nonnegative().max(10_000_000).optional(),
  coupon_code: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
  phone: z.string().max(20).optional(),
});

// Price preview for the checkout page. Prices come from the database (not the
// browser's saved cart) and use the same totals + coupon rules as
// /api/orders/create, so what the customer sees is what they are charged.
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  const admin = createAdminClient();

  // Coupon guessing protection
  if (body.coupon_code && !(await allow(`quote:${clientIp(req)}`, 40, 600, admin))) {
    return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
  }

  let subtotal = Math.max(0, Number(body.subtotal) || 0);
  if (body.lines?.length) {
    const { data: vs } = await admin
      .from("product_variants")
      .select("id, price_override, product:products(base_price)")
      .in("id", body.lines.map((l) => l.variant_id));
    const price = new Map((vs ?? []).map((v: any) => [v.id, Number(v.price_override ?? v.product?.base_price ?? 0)]));
    subtotal = body.lines.reduce((s, l) => s + (price.get(l.variant_id) ?? 0) * l.quantity, 0);
  }
  const s = await getShippingSettings();

  let discount = 0;
  let coupon: { code: string } | null = null;
  let coupon_error: string | null = null;
  if (body.coupon_code?.trim()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const r = await evaluateCoupon(admin, body.coupon_code, subtotal, { userId: user?.id, email: body.email || null, phone: body.phone || null });
    if (r.ok) {
      discount = r.discount;
      coupon = { code: r.coupon.code };
    } else {
      coupon_error = r.error;
    }
  }

  const t = computeTotals(subtotal, discount, s);
  return NextResponse.json({ ...t, coupon, coupon_error, prices_include_gst: s.prices_include_gst !== false });
}
