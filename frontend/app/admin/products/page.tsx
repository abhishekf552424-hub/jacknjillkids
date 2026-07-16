import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Plus, Edit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const admin = createAdminClient();
  const { data } = await admin.from("products").select("id, name, slug, base_price, mrp, status, is_featured, is_new_arrival").order("created_at", { ascending: false }).limit(200);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Catalogue</p>
          <h1 className="font-display text-3xl text-navy tracking-tight">Products</h1>
        </div>
        <Link href="/admin/products/new" data-testid="new-product-btn" className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> New product</Link>
      </div>

      <div className="bg-white rounded-lg shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Flags</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-navy/5 hover:bg-cream/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-muted">/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-navy font-medium">{formatINR(p.base_price)}</p>
                  {p.mrp > p.base_price && <p className="text-xs text-muted line-through">{formatINR(p.mrp)}</p>}
                </td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${p.status === "active" ? "bg-success/10 text-success" : "bg-navy/10 text-navy"}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.is_featured && <span className="mr-2 text-gold">★ Featured</span>}
                  {p.is_new_arrival && <span className="text-success">NEW</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="inline-flex items-center gap-1 text-xs text-navy hover:text-gold"><Edit className="w-3.5 h-3.5" /> Edit</Link>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No products yet. <Link href="/admin/products/new" className="underline text-gold">Add your first product</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
