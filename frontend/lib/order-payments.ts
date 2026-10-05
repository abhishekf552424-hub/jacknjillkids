import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/order-emails";

export type MarkPaidResult = "paid" | "already_paid" | "paid_needs_refund" | "not_found";

/**
 * Marks an online order paid exactly once (shared by /api/razorpay/verify and
 * the webhook — whichever arrives first wins).
 *
 * If the order's stock reservation had already expired (customer paid after
 * the 45-minute hold), we try to take the stock again. When it has sold out
 * in the meantime the order stays cancelled, is marked paid, and its history
 * says a refund is needed, so the team sees it in the admin.
 */
export async function markOrderPaid(
  admin: SupabaseClient,
  orderId: string,
  paymentId: string,
  source: "checkout" | "webhook",
): Promise<MarkPaidResult> {
  // One locked database step (migration 0016 mark_order_paid): checks it isn't
  // already paid, takes the stock back if the hold had expired, and marks it
  // paid — so a late payment and the 45-minute expiry can never clash.
  const { data, error } = await admin.rpc("mark_order_paid", { p_order_id: orderId, p_payment_id: paymentId });
  if (error) throw new Error(`mark_order_paid: ${error.message}`);
  const result = data as MarkPaidResult;
  if (result === "not_found" || result === "already_paid") return result;

  const stockOk = result === "paid";
  const via = source === "webhook" ? "Payment captured (webhook)" : "Payment received via Razorpay";
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status: stockOk ? "confirmed" : "cancelled",
    note: stockOk ? via : `${via} after the stock hold expired and the item sold out — REFUND NEEDED`,
  });

  if (stockOk) await sendOrderConfirmation(admin, orderId);
  return result;
}
