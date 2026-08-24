"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, Search } from "lucide-react";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";

type C = { id?: string; code: string; type: "percent" | "flat"; value: number; min_cart_value: number; max_discount: number | null; usage_limit: number | null; per_user_limit: number; valid_to: string | null; is_active: boolean };

export default function CouponsClient({ initial }: { initial: C[] }) {
  const [rows, setRows] = useState<C[]>(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"" | "active" | "expired">("");

  const update = (i: number, patch: Partial<C>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = async (c: C, i: number) => {
    const r = await fetch(`/api/admin/coupons${c.id ? `/${c.id}` : ""}`, {
      method: c.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    if (!r.ok) return toast.error("Save failed");
    const j = await r.json();
    if (!c.id && j.id) update(i, { id: j.id });
    toast.success("Saved");
  };

  const remove = async (i: number, c: C) => {
    if (!c.id) return setRows(rows.filter((_, j) => j !== i));
    if (!confirm("Delete coupon?")) return;
    await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
    setRows(rows.filter((_, j) => j !== i));
  };

  const isExpired = (c: C) => c.valid_to && new Date(c.valid_to) < new Date();

  const filtered = useMemo(() => {
    return rows.filter((c, i) => {
      if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "active" && (!c.is_active || isExpired(c))) return false;
      if (filter === "expired" && !isExpired(c)) return false;
      return true;
    }).map((c) => ({ c, i: rows.indexOf(c) }));
  }, [rows, search, filter]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Marketing"
        title="Coupons"
        action={
          <button onClick={() => setRows([...rows, { code: "", type: "percent", value: 10, min_cart_value: 0, max_discount: null, usage_limit: null, per_user_limit: 1, valid_to: null, is_active: true } as C])} className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/10 text-sm outline-none focus:border-gold bg-white" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 rounded-lg border border-navy/10 text-sm bg-white">
          <option value="">All coupons</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-navy">
              <tr><th className="text-left px-3 py-2">Code</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Value</th><th className="text-left px-3 py-2">Min cart</th><th className="text-left px-3 py-2">Valid to</th><th className="text-left px-3 py-2">Active</th><th className="text-right px-3 py-2"></th></tr>
            </thead>
            <tbody>
              {filtered.map(({ c, i }) => (
                <tr key={c.id ?? `n-${i}`} className="border-t border-navy/5 hover:bg-cream/50">
                  <td className="px-3 py-2"><input value={c.code} onChange={(e) => update(i, { code: e.target.value.toUpperCase() })} className="w-28 bg-cream rounded px-2 py-1 border border-navy/10 outline-none" /></td>
                  <td className="px-3 py-2"><select value={c.type} onChange={(e) => update(i, { type: e.target.value as any })} className="bg-cream rounded px-2 py-1 border border-navy/10"><option value="percent">%</option><option value="flat">₹</option></select></td>
                  <td className="px-3 py-2"><input type="number" value={c.value} onChange={(e) => update(i, { value: Number(e.target.value) })} className="w-20 bg-cream rounded px-2 py-1 border border-navy/10 outline-none" /></td>
                  <td className="px-3 py-2"><input type="number" value={c.min_cart_value} onChange={(e) => update(i, { min_cart_value: Number(e.target.value) })} className="w-24 bg-cream rounded px-2 py-1 border border-navy/10 outline-none" /></td>
                  <td className="px-3 py-2"><input type="date" value={c.valid_to?.slice(0,10) ?? ""} onChange={(e) => update(i, { valid_to: e.target.value || null })} className="bg-cream rounded px-2 py-1 border border-navy/10 outline-none text-xs" /></td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" checked={c.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} /></td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => save(c, i)} className="text-xs text-gold px-2"><Save className="w-4 h-4 inline" /></button>
                    <button onClick={() => remove(i, c)} className="text-xs text-error px-2"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No coupons match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
