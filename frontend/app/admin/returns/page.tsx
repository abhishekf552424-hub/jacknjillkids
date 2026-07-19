import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import ReturnRow from "./ReturnRow";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const admin = createAdminClient();
  const { data: returns } = await admin
    .from("returns")
    .select("*, order:orders(order_number, shipping_address)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-gold font-bold">Post-purchase</p>
        <h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">Returns &amp; exchanges</h1>
      </div>

      <div className="bg-white rounded-lg shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Reason</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Requested</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {(returns ?? []).length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-400">No return / exchange requests yet.</td></tr>}
            {(returns ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-3"><Link href={`/admin/orders/${r.order?.order_number}`} className="text-navy hover:underline">{r.order?.order_number}</Link></td>
                <td className="px-4 py-3 uppercase text-xs">{r.type === "size_exchange" ? "Size exchange" : r.type || "Return"}</td>
                <td className="px-4 py-3 text-neutral-600 text-xs max-w-xs truncate">{r.reason || "—"}</td>
                <td className="px-4 py-3"><span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-green-50 text-green-700" : r.status === "rejected" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right"><ReturnRow id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
