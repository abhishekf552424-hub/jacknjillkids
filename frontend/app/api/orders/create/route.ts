import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig, getShippingSettings } from "@/lib/settings";
import { sendEmail, orderConfirmationTemplate } from "@/lib/resend";
import { z } from "zod";
import Razorpay from "razorpay";

const Body = z.object({
  lines: z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1),
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
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Pull variants + product info; verify stock
    const variantIds = body.lines.map((l) => l.variant_id);
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
    for (const l of body.lines) {
      const v: any = varMap.get(l.variant_id);
      if (!v) return NextResponse.json({ ok: false, error: "Invalid item" }, { status: 400 });
      if (v.stock_qty < l.quantity) return NextResponse.json({ ok: false, error: `Only ${v.stock_qty} left for ${v.product.name}` }, { status: 400 });
      if (v.product.status !== "active") return NextResponse.json({ ok: false, error: `${v.product.name} is unavailable` }, { status: 400 });
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

    // Totals
    const s = await getShippingSettings();
    const shipping = subtotal >= s.free_above ? 0 : s.flat_fee;
    const tax = Math.round((subtotal + shipping) * (s.gst_percent / 100));
    const total = subtotal + shipping + tax;

    // Insert order
    const { data: order, error: oErr } = await admin.from("orders").insert({
      user_id: user?.id ?? null,
      guest_email: user ? null : body.address.email,
      guest_phone: user ? null : body.address.phone,
      status: "placed",
      subtotal, discount: 0, shipping_fee: shipping, tax, total,
      payment_status: body.payment_method === "cod" ? "cod" : "pending",
      payment_method: body.payment_method,
      shipping_address: body.address,
    }).select().single();
    if (oErr) throw oErr;

    // Order items
    await admin.from("order_items").insert(orderItems.map((it) => ({ ...it, order_id: order.id })));
    await admin.from("order_status_history").insert({ order_id: order.id, status: "placed", note: "Order placed" });

    // Decrement stock
    for (const l of body.lines) {
      const v: any = varMap.get(l.variant_id);
      await admin.from("product_variants").update({ stock_qty: v.stock_qty - l.quantity }).eq("id", l.variant_id);
    }

    let razorpay_order_id: string | null = null;
    let key_id = "";
    if (body.payment_method === "razorpay") {
      const cfg = await getRazorpayConfig();
      if (!cfg.enabled || !cfg.key_id || !cfg.key_secret || cfg.key_id.startsWith("rzp_test_placeholder")) {
        // No real keys — degrade to COD so the flow still works end-to-end
        await admin.from("orders").update({ payment_method: "cod", payment_status: "cod" }).eq("id", order.id);
        return NextResponse.json({
          ok: true,
          order_id: order.id,
          order_number: order.order_number,
          note: "Razorpay keys not configured in admin settings — order marked COD.",
        });
      }
      try {
        const rzp = new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret });
        const rzpOrder = await rzp.orders.create({
          amount: total * 100,
          currency: "INR",
          receipt: order.order_number,
          notes: { order_id: order.id },
        });
        razorpay_order_id = rzpOrder.id;
        key_id = cfg.key_id;
        await admin.from("orders").update({ razorpay_order_id }).eq("id", order.id);
      } catch (e: any) {
        console.error("Razorpay create error", e?.message);
        return NextResponse.json({ ok: false, error: "Payment gateway unavailable. Try COD." }, { status: 500 });
      }
    }

    // Send email (best-effort)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    sendEmail({
      to: body.address.email,
      subject: `Order confirmed — ${order.order_number}`,
      html: orderConfirmationTemplate({
        order_number: order.order_number,
        customer_name: body.address.full_name,
        total,
        items: orderItems.map((it) => ({ name: it.product_name, qty: it.quantity, price: it.price_at_purchase })),
        tracking_url: `${siteUrl}/orders/${order.order_number}`,
      }),
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      order_id: order.id,
      order_number: order.order_number,
      razorpay_order_id,
      amount: total * 100,
      key_id,
    });
  } catch (e: any) {
    console.error("[orders/create]", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "Order failed" }, { status: 400 });
  }
}
