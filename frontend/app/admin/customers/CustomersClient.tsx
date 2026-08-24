"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { AdminPageHeader, AdminCard, AdminTable, AdminThead, AdminTh, AdminTr, StatusPill } from "@/components/admin/ui";

type Row = { id: string; full_name: string | null; email: string; phone: string | null; role: string; created_at: string; order_count: number; total_spend: number };
type SortKey = "created_at" | "order_count" | "total_spend";

export default function CustomersClient({ initial }: { initial: Row[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    let list = initial.filter((p) =>
      !q ||
      (p.full_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else cmp = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [initial, search, sortKey, sortDir]);

  return (
    <div>
      <AdminPageHeader eyebrow="People" title="Customers" />

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, or phone…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/10 text-sm outline-none focus:border-gold bg-white" />
      </div>

      <AdminCard>
        <AdminTable>
          <AdminThead>
            <AdminTh>Name</AdminTh>
            <AdminTh>Email</AdminTh>
            <AdminTh>Phone</AdminTh>
            <AdminTh>Role</AdminTh>
            <AdminTh><button onClick={() => toggleSort("order_count")} className="hover:text-navy">Orders {sortKey === "order_count" && (sortDir === "asc" ? "↑" : "↓")}</button></AdminTh>
            <AdminTh><button onClick={() => toggleSort("total_spend")} className="hover:text-navy">Spend {sortKey === "total_spend" && (sortDir === "asc" ? "↑" : "↓")}</button></AdminTh>
            <AdminTh><button onClick={() => toggleSort("created_at")} className="hover:text-navy">Joined {sortKey === "created_at" && (sortDir === "asc" ? "↑" : "↓")}</button></AdminTh>
          </AdminThead>
          <tbody>
            {rows.map((p) => (
              <AdminTr key={p.id}>
                <td className="px-4 py-3 text-navy">{p.full_name || "—"}</td>
                <td className="px-4 py-3 text-muted">{p.email}</td>
                <td className="px-4 py-3 text-muted">{p.phone || "—"}</td>
                <td className="px-4 py-3"><StatusPill label={p.role.replace(/_/g, " ")} tone="neutral" /></td>
                <td className="px-4 py-3 text-navy">{p.order_count}</td>
                <td className="px-4 py-3 text-navy font-medium">{formatINR(p.total_spend)}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
              </AdminTr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No customers match.</td></tr>
            )}
          </tbody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
