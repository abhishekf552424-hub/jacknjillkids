import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";
import { isValidCheckoutSignature } from "@/lib/payments";
import { markOrderPaid } from "@/lib/order-payments";
import { z } from "zod";

const Body = z.object({
  order_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const cfg = await getRazorpayConfig();
    const admin = createAdminClient();

    if (!isValidCheckoutSignature(cfg.key_secret, body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
      return NextResponse.json({ ok: false, error: "Signature mismatch" }, { status: 400 });
    }

    // The signature only proves this payment belongs to `razorpay_order_id`.
    // It must also be the Razorpay order that THIS order created — otherwise a
    // payment for a cheap order could be replayed to mark a different order paid.
    const { data: order } = await admin
      .from("orders")
      .select("id, razorpay_order_id, payment_status")
      .eq("id", body.order_id)
      .maybeSingle();
    if (!order || !order.razorpay_order_id || order.razorpay_order_id !== body.razorpay_order_id) {
      return NextResponse.json({ ok: false, error: "Payment does not match this order" }, { status: 400 });
    }
    if (order.payment_status === "paid") {
      return NextResponse.json({ ok: true, already: true });
    }

    // Only the first caller (this route or the webhook) marks it paid.
    const result = await markOrderPaid(admin, order.id, body.razorpay_payment_id, "checkout");
    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("[razorpay/verify]", e?.message);
    return NextResponse.json({ ok: false, error: "Verify failed" }, { status: 400 });
  }
}
