import crypto from "crypto";
import { SITE_URL } from "@/lib/site";

/**
 * Order access tokens let guests (no account) open their own order page and
 * invoice. The token is an HMAC of the order number, so it cannot be guessed
 * from the sequential order number alone.
 */
function key(): Buffer {
  const base = process.env.ORDER_ACCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("ORDER_ACCESS_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set");
  return crypto.createHash("sha256").update(`jj-order-access-v1:${base}`).digest();
}

export function makeOrderAccessToken(orderNumber: string): string {
  return crypto.createHmac("sha256", key()).update(`order:${orderNumber}`).digest("base64url").slice(0, 32);
}

export function isValidOrderAccessToken(orderNumber: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(makeOrderAccessToken(orderNumber));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Customer-facing order URL that works for guests too. */
export function orderUrl(orderNumber: string, siteUrl = SITE_URL): string {
  return `${siteUrl}/orders/${orderNumber}?t=${makeOrderAccessToken(orderNumber)}`;
}
