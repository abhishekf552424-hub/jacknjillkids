import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";
import { isValidWebhookSignature, toPaise } from "@/lib/payments";
import { markOrderPaid } from "@/lib/order-payments";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const cfg = await getRazorpayConfig();
  if (!cfg.webhook_secret) return NextResponse.json({ ok: false, error: "Webhook secret missing" }, { status: 400 });
  if (!isValidWebhookSignature(cfg.webhook_secret, raw, sig)) return NextResponse.json({ ok: false }, { status: 400 });

  let evt: any;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const admin = createAdminClient();

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    const payment = evt.payload?.payment?.entity;
    const rzpOrderId = payment?.order_id || evt.payload?.order?.entity?.id;
    const paymentId = payment?.id;
    const paidAmount = Number(payment?.amount ?? evt.payload?.order?.entity?.amount_paid ?? 0);
    if (rzpOrderId) {
      const { data: o } = await admin
        .from("orders")
        .select("id, payment_status, total")
        .eq("razorpay_order_id", rzpOrderId)
        .maybeSingle();
      if (o && o.payment_status !== "paid") {
        if (paidAmount !== toPaise(o.total)) {
          console.error("[razorpay/webhook] amount mismatch", { order: o.id, paidAmount, expected: toPaise(o.total) });
          return NextResponse.json({ ok: true, ignored: "amount_mismatch" });
        }
        await markOrderPaid(admin, o.id, paymentId, "webhook");
      }
    }
  }
  return NextResponse.json({ ok: true });
}
