import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";
import { isValidCheckoutSignature } from "@/lib/payments";
import { sendOrderConfirmation } from "@/lib/order-emails";
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

    // Conditional update: only the first caller (this route or the webhook) wins.
    const { data: updated } = await admin
      .from("orders")
      .update({ payment_status: "paid", razorpay_payment_id: body.razorpay_payment_id, status: "confirmed" })
      .eq("id", order.id)
      .eq("razorpay_order_id", body.razorpay_order_id)
      .neq("payment_status", "paid")
      .select("id");
    if (updated && updated.length > 0) {
      await admin.from("order_status_history").insert({
        order_id: order.id,
        status: "confirmed",
        note: "Payment received via Razorpay",
      });
      await sendOrderConfirmation(admin, order.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[razorpay/verify]", e?.message);
    return NextResponse.json({ ok: false, error: "Verify failed" }, { status: 400 });
  }
}
