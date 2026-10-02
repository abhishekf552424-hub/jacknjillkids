import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig, getShippingSettings } from "@/lib/settings";
import { sendEmail, orderConfirmationTemplate } from "@/lib/resend";
import { evaluateCoupon, computeTotals } from "@/lib/coupons";
import { makeOrderAccessToken, orderUrl } from "@/lib/order-access";
import { toPaise } from "@/lib/payments";
import { z } from "zod";
import Razorpay from "razorpay";

const Body = z.object({
  lines: z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
  address: z.object({
    full_name: z.string().min(2),
    phone: z.string().regex(/^\d{10}$/),
    email: z.string().email(),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  payment_method: z.enum(["razorpay", "cod"]),
  coupon_code: z.string().max(40).optional(),
});

// Online orders hold their stock this long; unpaid ones are then cancelled
// and the stock returned (expire_unpaid_orders in migration 0011).
const RESERVATION_MINUTES = 45;

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const supabase = await createClient();
    const admin = createAdminClient();
    const email = body.address.email.trim().toLowerCase();

    // Free stock held by abandoned online payments before checking availability.
    const { error: expErr } = await admin.rpc("expire_unpaid_orders", { p_minutes: RESERVATION_MINUTES });
    if (expErr) console.error("[orders/create] expire_unpaid_orders", expErr.message);

    const { data: { user } } = await supabase.auth.getUser();

    // Merge duplicate lines for the same variant so the stock check sees the real quantity.
    const qtyByVariant = new Map<string, number>();
    for (const l of body.lines) qtyByVariant.set(l.variant_id, (qtyByVariant.get(l.variant_id) ?? 0) + l.quantity);
    const lines = Array.from(qtyByVariant, ([variant_id, quantity]) => ({ variant_id, quantity }));

    // Delivery + COD rules are enforced here, not only in the browser.
    const { data: pin } = await admin.from("pincodes").select("is_serviceable, cod_available").eq("pincode", body.address.pincode).maybeSingle();
    if (pin && pin.is_serviceable === false) return fail("Sorry, we don't deliver to this pincode yet.");
    if (body.payment_method === "cod") {
      const { data: codSetting } = await admin.from("settings").select("value").eq("key", "cod").maybeSingle();
      if ((codSetting?.value as any)?.enabled === false) return fail("Cash on Delivery is currently unavailable. Please pay online.");
      if (pin && pin.cod_available === false) return fail("Cash on Delivery isn't available for this pincode. Please pay online.");
      if (user) {
        const { data: prof } = await admin.from("profiles").select("cod_blocked").eq("id", user.id).maybeSingle();
        if (prof?.cod_blocked) return fail("Cash on Delivery isn't available for this account. Please pay online.");
      }
    }

    // Pull variants + product info; verify stock
    const variantIds = lines.map((l) => l.variant_id);
    const { data: variants, error: vErr } = await admin
      .from("product_variants")
      .select("id, product_id, size, color, sku, stock_qty, price_override, product:products(name, base_price, mrp, slug, status)")
      .in("id", variantIds);
    if (vErr) throw vErr;
    const varMap = new Map((variants ?? []).map((v: any) => [v.id, v]));

    // Fetch primary images
    const productIds = Array.from(new Set((variants ?? []).map((v: any) => v.product_id))) as string[];
    const { data: imgs } = await admin
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", productIds)
      .order("sort_order");
    const imgByProduct = new Map<string, string>();
    (imgs ?? []).forEach((i: any) => { if (!imgByProduct.has(i.product_id)) imgByProduct.set(i.product_id, i.url); });

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const l of lines) {
      const v: any = varMap.get(l.variant_id);
      if (!v) return fail("One of the items in your bag is no longer available.");
      if (v.product.status !== "active") return fail(`${v.product.name} is unavailable`);
      if (v.stock_qty < l.quantity) return fail(`Only ${v.stock_qty} left for ${v.product.name}`);
      const price = Number(v.price_override ?? v.product.base_price);
      subtotal += price * l.quantity;
      orderItems.push({
        variant_id: v.id,
        product_name: v.product.name,
        variant_label: [v.size, v.color].filter(Boolean).join(" / ") || null,
        image_url: imgByProduct.get(v.product_id) || null,
        quantity: l.quantity,
        price_at_purchase: price,
      });
    }

    // Coupon (validated on the server — the browser only sends the code)
    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (body.coupon_code?.trim()) {
      const c = await evaluateCoupon(admin, body.coupon_code, subtotal, { userId: user?.id, email });
      if (!c.ok) return fail(c.error);
      discount = c.discount;
      couponId = c.coupon.id;
      couponCode = c.coupon.code;
    }

    const s = await getShippingSettings();
    const t = computeTotals(subtotal, discount, s);

    // One database transaction: reserve stock for every line (only if enough is
    // left), create the order, items, history and coupon usage. If any line is
    // short, nothing is written. See supabase/migrations/0011_order_engine.sql.
    const isOnline = body.payment_method === "razorpay";
    const { data: order, error: oErr } = await admin.rpc("place_order", {
      p_order: {
        user_id: user?.id ?? null,
        guest_email: user ? null : email,
        guest_phone: user ? null : body.address.phone,
        subtotal: t.subtotal,
        discount: t.discount,
        shipping_fee: t.shipping,
        tax: t.tax,
        total: t.total,
        coupon_code: couponCode,
        payment_status: isOnline ? "pending" : "cod",
        payment_method: body.payment_method,
        shipping_address: { ...body.address, email },
        reserved_until: isOnline ? new Date(Date.now() + RESERVATION_MINUTES * 60_000).toISOString() : null,
      },
      p_items: orderItems,
      p_coupon_id: couponId,
    });
    if (oErr || !order) {
      const m = /OUT_OF_STOCK:([0-9a-f-]{36})/.exec(oErr?.message || "");
      if (m) {
        const v: any = varMap.get(m[1]);
        return fail(`Sorry — ${v?.product?.name ?? "an item in your bag"} just sold out in that size. Please update your bag.`, 409);
      }
      throw oErr ?? new Error("place_order returned no order");
    }

    const access_token = makeOrderAccessToken(order.order_number);
    const sendConfirmation = () =>
      sendEmail({
        to: email,
        subject: `Order confirmed — ${order.order_number}`,
        html: orderConfirmationTemplate({
          order_number: order.order_number,
          customer_name: body.address.full_name,
          total: t.total,
          items: orderItems.map((it) => ({ name: it.product_name, qty: it.quantity, price: it.price_at_purchase })),
          tracking_url: orderUrl(order.order_number),
        }),
      }).catch(() => {});

    let razorpay_order_id: string | null = null;
    let key_id = "";
    if (body.payment_method === "razorpay") {
      const cfg = await getRazorpayConfig();
      if (!cfg.enabled || !cfg.key_id || !cfg.key_secret || cfg.key_id.startsWith("rzp_test_placeholder")) {
        // No real keys — degrade to COD so the flow still works end-to-end
        await admin.from("orders").update({ payment_method: "cod", payment_status: "cod", reserved_until: null }).eq("id", order.id);
        sendConfirmation();
        return NextResponse.json({
          ok: true,
          order_id: order.id,
          order_number: order.order_number,
          access_token,
          note: "Razorpay keys not configured in admin settings — order marked COD.",
        });
      }
      try {
        const rzp = new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret });
        const rzpOrder = await rzp.orders.create({
          amount: toPaise(t.total),
          currency: "INR",
          receipt: order.order_number,
          notes: { order_id: order.id },
        });
        razorpay_order_id = rzpOrder.id;
        key_id = cfg.key_id;
        await admin.from("orders").update({ razorpay_order_id }).eq("id", order.id);
      } catch (e: any) {
        console.error("Razorpay create error", e?.message);
        // Give the reserved stock straight back — this order can never be paid.
        await admin.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", order.id);
        await admin.rpc("release_order_stock", { p_order_id: order.id });
        await admin.from("order_status_history").insert({ order_id: order.id, status: "cancelled", note: "Payment gateway unavailable — stock released" });
        return fail("Payment gateway unavailable. Please try again or choose Cash on Delivery.", 503);
      }
      // Confirmation email for online payments is sent after payment is verified.
    } else {
      sendConfirmation();
    }

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      order_number: order.order_number,
      access_token,
      razorpay_order_id,
      amount: toPaise(t.total),
      key_id,
    });
  } catch (e: any) {
    console.error("[orders/create]", e?.message);
    const msg = e instanceof z.ZodError ? "Please check your address details" : "Order failed. Please try again.";
    return fail(msg);
  }
}
