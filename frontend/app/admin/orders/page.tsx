import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-gold font-bold">Fulfilment</p>
        <h1 className="font-display text-3xl text-navy tracking-tight">Orders</h1>
      </div>
      <div className="bg-white rounded-lg shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((o: any) => (
              <tr key={o.id} className="border-t border-navy/5 hover:bg-cream/50">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.order_number}`} className="text-navy font-medium hover:text-gold">{o.order_number}</Link></td>
                <td className="px-4 py-3">
                  <p className="text-navy text-sm">{o.shipping_address?.full_name}</p>
                  <p className="text-xs text-muted">{o.shipping_address?.email}</p>
                </td>
                <td className="px-4 py-3 text-navy font-medium">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><span className="text-xs uppercase tracking-widest text-gold">{o.payment_method}</span> · <span className="text-xs text-muted">{o.payment_status}</span></td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-navy/5 text-navy capitalize">{o.status.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3 text-xs text-muted">{new Date(o.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
