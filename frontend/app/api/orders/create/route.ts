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

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const supabase = await createClient();
    const admin = createAdminClient();
    const email = body.address.email.trim().toLowerCase();

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

    // Insert order
    const { data: order, error: oErr } = await admin.from("orders").insert({
      user_id: user?.id ?? null,
      guest_email: user ? null : email,
      guest_phone: user ? null : body.address.phone,
      status: "placed",
      subtotal: t.subtotal, discount: t.discount, shipping_fee: t.shipping, tax: t.tax, total: t.total,
      coupon_code: couponCode,
      payment_status: body.payment_method === "cod" ? "cod" : "pending",
      payment_method: body.payment_method,
      shipping_address: { ...body.address, email },
    }).select().single();
    if (oErr) throw oErr;

    await admin.from("order_items").insert(orderItems.map((it) => ({ ...it, order_id: order.id })));
    await admin.from("order_status_history").insert({ order_id: order.id, status: "placed", note: "Order placed" });
    if (couponId) await admin.from("coupon_usages").insert({ coupon_id: couponId, user_id: user?.id ?? null, order_id: order.id });

    // Decrement stock (conditional on the value we read, so a concurrent order
    // cannot silently oversell; a full reservation system comes with the
    // place_order() transaction in the next phase).
    for (const l of lines) {
      const v: any = varMap.get(l.variant_id);
      const { data: dec } = await admin
        .from("product_variants")
        .update({ stock_qty: v.stock_qty - l.quantity })
        .eq("id", l.variant_id)
        .eq("stock_qty", v.stock_qty)
        .select("id");
      if (!dec || dec.length === 0) {
        console.error("[orders/create] stock changed concurrently", { order: order.order_number, variant: l.variant_id });
      }
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
        await admin.from("orders").update({ payment_method: "cod", payment_status: "cod" }).eq("id", order.id);
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
        return fail("Payment gateway unavailable. Try COD.", 500);
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
