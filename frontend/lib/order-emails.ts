import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, orderConfirmationTemplate } from "@/lib/resend";
import { orderUrl } from "@/lib/order-access";

/** Sends the order confirmation email (best-effort; never throws). */
export async function sendOrderConfirmation(admin: SupabaseClient, orderId: string): Promise<void> {
  try {
    const { data: o } = await admin
      .from("orders")
      .select("order_number, total, shipping_address, guest_email, items:order_items(product_name, quantity, price_at_purchase)")
      .eq("id", orderId)
      .maybeSingle();
    const to = (o?.shipping_address as any)?.email || o?.guest_email;
    if (!o || !to) return;
    await sendEmail({
      to,
      subject: `Order confirmed — ${o.order_number}`,
      html: orderConfirmationTemplate({
        order_number: o.order_number,
        customer_name: (o.shipping_address as any)?.full_name || "",
        total: Number(o.total),
        items: ((o.items as any[]) ?? []).map((it) => ({ name: it.product_name, qty: it.quantity, price: Number(it.price_at_purchase) })),
        tracking_url: orderUrl(o.order_number),
      }),
    });
  } catch (e: any) {
    console.error("[order-emails] confirmation failed", e?.message);
  }
}
