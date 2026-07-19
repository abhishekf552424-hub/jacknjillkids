import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import OrderStatusForm from "./OrderStatusForm";
import OrderActions from "./OrderActions";
import { formatINR, ORDER_STAGES } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, items:order_items(*), history:order_status_history(*)")
    .eq("order_number", number)
    .maybeSingle();
  if (!order) return notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-xs text-gold underline">← All orders</Link>
      <h1 className="font-display text-3xl text-navy mt-1">{order.order_number}</h1>
      <p className="text-xs text-muted mt-1">Placed on {new Date(order.created_at).toLocaleString("en-IN")}</p>

      <div className="mt-4"><OrderActions orderNumber={order.order_number} phone={order.shipping_address?.phone} status={order.status} /></div>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy mb-3">Items</h2>
            <ul className="divide-y divide-navy/5">
              {(order.items ?? []).map((it: any) => (
                <li key={it.id} className="py-3 flex gap-3">
                  <div className="relative w-14 h-14 rounded overflow-hidden bg-cream shrink-0">
                    {it.image_url && <Image src={it.image_url} alt={it.product_name} fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium text-navy line-clamp-2">{it.product_name}</p><p className="text-xs text-muted">{it.variant_label} × {it.quantity}</p></div>
                  <p className="text-sm text-navy font-medium">{formatINR(it.price_at_purchase * it.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="pt-4 mt-4 border-t border-navy/10 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-navy">{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="text-navy">{formatINR(order.shipping_fee)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tax</span><span className="text-navy">{formatINR(order.tax)}</span></div>
              <div className="flex justify-between font-display text-lg text-navy border-t border-navy/10 pt-3 mt-3"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy mb-3">Shipping address</h2>
            <p className="text-sm text-navy font-medium">{order.shipping_address.full_name}</p>
            <p className="text-sm text-muted">{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}</p>
            <p className="text-sm text-muted">{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
            <p className="text-sm text-muted">{order.shipping_address.phone} • {order.shipping_address.email}</p>
          </div>

          <div className="bg-white rounded-lg p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy mb-3">Timeline</h2>
            <ul className="space-y-3">
              {(order.history ?? []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((h: any) => (
                <li key={h.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold mt-1.5" />
                  <div><p className="text-sm font-medium text-navy capitalize">{h.status.replace(/_/g, " ")}</p>{h.note && <p className="text-xs text-muted">{h.note}</p>}<p className="text-xs text-muted">{new Date(h.created_at).toLocaleString("en-IN")}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <OrderStatusForm orderId={order.id} orderNumber={order.order_number} customerEmail={order.shipping_address?.email} currentStatus={order.status} />
          <div className="bg-white rounded-lg p-5 shadow-soft text-sm">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-2">Payment</p>
            <p className="text-navy">Method: <strong>{order.payment_method}</strong></p>
            <p className="text-navy">Status: <strong className="uppercase">{order.payment_status}</strong></p>
            {order.razorpay_payment_id && <p className="text-xs text-muted mt-1">RZP: {order.razorpay_payment_id}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
