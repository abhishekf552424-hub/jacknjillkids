import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const cfg = await getRazorpayConfig();
  if (!cfg.webhook_secret) return NextResponse.json({ ok: false, error: "Webhook secret missing" }, { status: 400 });

  const expected = crypto.createHmac("sha256", cfg.webhook_secret).update(raw).digest("hex");
  if (expected !== sig) return NextResponse.json({ ok: false }, { status: 400 });

  const evt = JSON.parse(raw);
  const admin = createAdminClient();

  if (evt.event === "payment.captured" || evt.event === "order.paid") {
    const rzpOrderId = evt.payload?.payment?.entity?.order_id || evt.payload?.order?.entity?.id;
    const paymentId = evt.payload?.payment?.entity?.id;
    if (rzpOrderId) {
      const { data: o } = await admin.from("orders").select("id, payment_status").eq("razorpay_order_id", rzpOrderId).maybeSingle();
      if (o && o.payment_status !== "paid") {
        await admin.from("orders").update({ payment_status: "paid", razorpay_payment_id: paymentId, status: "confirmed" }).eq("id", o.id);
        await admin.from("order_status_history").insert({ order_id: o.id, status: "confirmed", note: "Payment captured (webhook)" });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
