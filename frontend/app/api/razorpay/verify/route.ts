import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";
import { z } from "zod";

const Body = z.object({
  order_id: z.string().uuid(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const cfg = await getRazorpayConfig();
    const admin = createAdminClient();

    const expected = crypto
      .createHmac("sha256", cfg.key_secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== body.razorpay_signature) {
      return NextResponse.json({ ok: false, error: "Signature mismatch" }, { status: 400 });
    }

    await admin
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: body.razorpay_payment_id,
        status: "confirmed",
      })
      .eq("id", body.order_id);
    await admin.from("order_status_history").insert({
      order_id: body.order_id,
      status: "confirmed",
      note: "Payment received via Razorpay",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Verify failed" }, { status: 400 });
  }
}
