import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatINR, ORDER_STAGES } from "@/lib/utils";
import { PackageCheck, Truck, Home, Circle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { number } = await params;
  const { new: isNew } = await searchParams;
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), history:order_status_history(*)")
    .eq("order_number", number)
    .maybeSingle();
  if (!order) return notFound();

  const activeIdx = Math.max(0, ORDER_STAGES.findIndex((s) => s.key === order.status));
  const progress = order.status === "delivered" ? 100 : (activeIdx / (ORDER_STAGES.length - 1)) * 100;

  return (
    <div className="container py-10 md:py-16 max-w-4xl">
      {isNew && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-success text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display text-xl text-navy">Order placed successfully</p>
            <p className="text-sm text-muted">A confirmation has been emailed to {order.shipping_address.email}.</p>
          </div>
        </div>
      )}

      <p className="text-xs uppercase tracking-widest text-gold font-bold">Order</p>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mt-1">
        <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight">{order.order_number}</h1>
        <span className="text-sm text-muted">Placed on {new Date(order.created_at).toLocaleDateString("en-IN")}</span>
      </div>

      {/* Tracker */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-soft" data-testid="order-tracker">
        <div className="relative">
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-navy/10 rounded-full" />
          <div className="absolute top-3 left-0 h-0.5 bg-success rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          <div className="relative flex justify-between">
            {ORDER_STAGES.map((s, i) => {
              const done = i <= activeIdx && order.status !== "cancelled";
              return (
                <div key={s.key} className="flex flex-col items-center gap-2 min-w-0" style={{ flex: 1 }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-success text-white" : "bg-navy/10 text-navy/40"}`}>
                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />}
                  </div>
                  <span className={`text-[10px] md:text-xs text-center leading-tight ${done ? "text-navy font-medium" : "text-muted"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        {order.status === "cancelled" && (
          <p className="mt-6 text-center text-error font-medium">This order was cancelled.</p>
        )}
      </div>

      {/* Items */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-soft">
        <h2 className="font-display text-xl text-navy mb-4">Items</h2>
        <ul className="divide-y divide-navy/5">
          {(order.items ?? []).map((it: any) => (
            <li key={it.id} className="py-3 flex gap-3">
              <div className="relative w-14 h-14 rounded overflow-hidden bg-cream shrink-0">
                {it.image_url && <Image src={it.image_url} alt={it.product_name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy line-clamp-2">{it.product_name}</p>
                {it.variant_label && <p className="text-xs text-muted">{it.variant_label} × {it.quantity}</p>}
              </div>
              <p className="text-sm font-medium text-navy">{formatINR(it.price_at_purchase * it.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-navy/10 space-y-1.5">
          <Row l="Subtotal" v={formatINR(order.subtotal)} />
          <Row l="Shipping" v={order.shipping_fee ? formatINR(order.shipping_fee) : "FREE"} />
          <Row l="Tax" v={formatINR(order.tax)} />
          {order.discount > 0 && <Row l="Discount" v={`− ${formatINR(order.discount)}`} />}
          <div className="pt-3 flex justify-between font-display text-lg text-navy border-t border-navy/10 mt-3">
            <span>Total paid</span><span>{formatINR(order.total)}</span>
          </div>
          <p className="text-xs text-muted">Payment: {order.payment_method === "cod" ? "Cash on Delivery" : "Razorpay"} • {order.payment_status.toUpperCase()}</p>
        </div>
      </div>

      {/* Address */}
      <div className="mt-6 bg-white rounded-lg p-6 shadow-soft">
        <h2 className="font-display text-xl text-navy mb-2">Shipping to</h2>
        <p className="text-sm text-navy font-medium">{order.shipping_address.full_name}</p>
        <p className="text-sm text-muted">{order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
        <p className="text-sm text-muted">{order.shipping_address.phone} • {order.shipping_address.email}</p>
      </div>

      {/* History */}
      {(order.history ?? []).length > 0 && (
        <div className="mt-6 bg-white rounded-lg p-6 shadow-soft">
          <h2 className="font-display text-xl text-navy mb-4">Timeline</h2>
          <ul className="space-y-3">
            {(order.history ?? []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((h: any) => (
              <li key={h.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-gold mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-navy capitalize">{h.status.replace(/_/g, " ")}</p>
                  {h.note && <p className="text-xs text-muted">{h.note}</p>}
                  <p className="text-xs text-muted">{new Date(h.created_at).toLocaleString("en-IN")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/shop" className="inline-flex items-center border-2 border-gold text-gold rounded px-6 py-3 text-sm font-medium hover:bg-gold hover:text-white transition-all">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between text-sm"><span className="text-muted">{l}</span><span className="text-navy">{v}</span></div>;
}
