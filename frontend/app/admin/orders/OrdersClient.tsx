"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Search } from "lucide-react";

export default function OrdersClient({ rows, initialFilters }: { rows: any[]; initialFilters: { q?: string; status?: string; payment?: string; from?: string; to?: string } }) {
  const router = useRouter();
  const [f, setF] = useState({
    q: initialFilters.q || "",
    status: initialFilters.status || "",
    payment: initialFilters.payment || "",
    from: initialFilters.from || "",
    to: initialFilters.to || "",
  });

  const apply = () => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/admin/orders${params.toString() ? "?" + params.toString() : ""}`);
  };
  const reset = () => { setF({ q: "", status: "", payment: "", from: "", to: "" }); router.push("/admin/orders"); };

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-gold font-bold">Fulfilment</p>
        <h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">Orders</h1>
      </div>

      <div className="bg-white rounded-lg p-3 md:p-4 shadow-soft mb-4 grid gap-2 md:grid-cols-[1.5fr_repeat(4,1fr)_auto_auto]">
        <div className="flex items-center gap-2 bg-neutral-50 rounded px-2 py-1.5">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") apply(); }} placeholder="Search order # / name / phone / email" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className="text-sm border rounded px-2 py-1.5 bg-white">
          <option value="">All statuses</option>
          <option value="placed">Placed</option>
          <option value="confirmed">Confirmed</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })} className="text-sm border rounded px-2 py-1.5 bg-white">
          <option value="">Any payment</option>
          <option value="cod">COD</option>
          <option value="razorpay">Razorpay</option>
          <option value="upi">UPI</option>
        </select>
        <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className="text-sm border rounded px-2 py-1.5" />
        <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className="text-sm border rounded px-2 py-1.5" />
        <button onClick={apply} className="bg-navy text-white rounded px-3 py-1.5 text-sm">Apply</button>
        <button onClick={reset} className="text-neutral-500 text-sm hover:text-navy">Reset</button>
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
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No orders match.</td></tr>
            ) : rows.map((o: any) => (
              <tr key={o.id} className="border-t border-navy/5 hover:bg-cream/50">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.order_number}`} className="text-navy font-medium hover:underline">{o.order_number}</Link></td>
                <td className="px-4 py-3">{o.shipping_address?.full_name || "—"}<div className="text-[10px] text-neutral-400">{o.shipping_address?.phone}</div></td>
                <td className="px-4 py-3">{formatINR(o.total)}</td>
                <td className="px-4 py-3 uppercase text-xs">{o.payment_method}</td>
                <td className="px-4 py-3"><span className="text-[10px] uppercase tracking-widest text-gold">{o.status.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
