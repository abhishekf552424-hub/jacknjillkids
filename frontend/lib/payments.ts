import crypto from "crypto";

/** HMAC-SHA256 hex digest. */
export function hmacHex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/** Constant-time comparison of two hex/utf8 strings (false on length mismatch). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ab.length === 0 || ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Razorpay checkout callback signature: HMAC(key_secret, "<order_id>|<payment_id>"). */
export function isValidCheckoutSignature(keySecret: string, rzpOrderId: string, rzpPaymentId: string, signature: string): boolean {
  if (!keySecret) return false;
  return safeEqual(hmacHex(keySecret, `${rzpOrderId}|${rzpPaymentId}`), signature);
}

/** Razorpay webhook signature: HMAC(webhook_secret, rawBody). */
export function isValidWebhookSignature(webhookSecret: string, rawBody: string, signature: string): boolean {
  if (!webhookSecret) return false;
  return safeEqual(hmacHex(webhookSecret, rawBody), signature);
}

/** Order total in paise exactly as sent to Razorpay when the order was created. */
export function toPaise(totalRupees: number | string): number {
  return Math.round(Number(totalRupees) * 100);
}
