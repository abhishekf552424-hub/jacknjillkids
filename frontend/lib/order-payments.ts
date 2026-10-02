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
  const { data: o } = await admin
    .from("orders")
    .select("id, status, payment_status, stock_released")
    .eq("id", orderId)
    .maybeSingle();
  if (!o) return "not_found";
  if (o.payment_status === "paid") return "already_paid";

  let stockOk = true;
  if (o.stock_released) {
    const { data: reclaimed, error } = await admin.rpc("reclaim_order_stock", { p_order_id: o.id });
    stockOk = !error && reclaimed === true;
  }

  const nextStatus = stockOk ? "confirmed" : "cancelled";
  const { data: updated } = await admin
    .from("orders")
    .update({ payment_status: "paid", razorpay_payment_id: paymentId, status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", o.id)
    .neq("payment_status", "paid")
    .select("id");
  if (!updated || updated.length === 0) return "already_paid";

  const via = source === "webhook" ? "Payment captured (webhook)" : "Payment received via Razorpay";
  await admin.from("order_status_history").insert({
    order_id: o.id,
    status: nextStatus,
    note: stockOk ? via : `${via} after the stock hold expired and the item sold out — REFUND NEEDED`,
  });

  if (stockOk) await sendOrderConfirmation(admin, o.id);
  return stockOk ? "paid" : "paid_needs_refund";
}
