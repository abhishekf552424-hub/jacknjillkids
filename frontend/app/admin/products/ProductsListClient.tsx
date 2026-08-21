"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Edit, Search, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { AdminPageHeader, AdminCard, AdminTable, AdminThead, AdminTh, AdminTr, StatusPill, BulkActionBar } from "@/components/admin/ui";

type Product = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  mrp: number;
  status: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  category_id: string | null;
  created_at: string;
};
type Category = { id: string; name: string };
type SortKey = "name" | "base_price" | "created_at";

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warn"> = {
  active: "success",
  draft: "neutral",
  out_of_stock: "warn",
  archived: "danger",
};

export default function ProductsListClient({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "base_price") cmp = a.base_price - b.base_price;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [products, search, statusFilter, categoryFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => (prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id))));
  };

  const bulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (action === "delete" && !confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    setBusy(true);
    const ids = Array.from(selected);
    const res = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      toast.error(j.error || "Bulk action failed");
      return;
    }
    if (action === "delete") {
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      toast.success(`Deleted ${ids.length} product(s)`);
    } else {
      setProducts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: action === "activate" ? "active" : "inactive" } : p)));
      toast.success(`Updated ${ids.length} product(s)`);
    }
    setSelected(new Set());
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        action={
          <Link href="/admin/products/new" data-testid="new-product-btn" className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New product
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or slug…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/10 text-sm outline-none focus:border-gold bg-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-navy/10 text-sm bg-white">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="archived">Archived</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-navy/10 text-sm bg-white">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={busy} onClick={() => bulkAction("activate")} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Activate
        </button>
        <button disabled={busy} onClick={() => bulkAction("deactivate")} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-xs">
          <XCircle className="w-3.5 h-3.5" /> Deactivate
        </button>
        <button disabled={busy} onClick={() => bulkAction("delete")} className="flex items-center gap-1 bg-error/80 hover:bg-error rounded px-3 py-1.5 text-xs">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </BulkActionBar>

      <AdminCard>
        <AdminTable>
          <AdminThead>
            <AdminTh>
              <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length} onChange={toggleAll} />
            </AdminTh>
            <AdminTh>
              <button onClick={() => toggleSort("name")} className="hover:text-navy">Name {sortKey === "name" && (sortDir === "asc" ? "↑" : "↓")}</button>
            </AdminTh>
            <AdminTh>Category</AdminTh>
            <AdminTh>
              <button onClick={() => toggleSort("base_price")} className="hover:text-navy">Price {sortKey === "base_price" && (sortDir === "asc" ? "↑" : "↓")}</button>
            </AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Flags</AdminTh>
            <AdminTh align="right">Actions</AdminTh>
          </AdminThead>
          <tbody>
            {filtered.map((p) => (
              <AdminTr key={p.id}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-muted">/{p.slug}</p>
                </td>
                <td className="px-4 py-3 text-navy/80">{categoryName(p.category_id)}</td>
                <td className="px-4 py-3">
                  <p className="text-navy font-medium">{formatINR(p.base_price)}</p>
                  {p.mrp > p.base_price && <p className="text-xs text-muted line-through">{formatINR(p.mrp)}</p>}
                </td>
                <td className="px-4 py-3"><StatusPill label={p.status.replace("_", " ")} tone={STATUS_TONE[p.status] ?? "neutral"} /></td>
                <td className="px-4 py-3 text-xs text-muted">
                  {p.is_featured && <span className="mr-2 text-gold">★ Featured</span>}
                  {p.is_new_arrival && <span className="text-success">NEW</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="inline-flex items-center gap-1 text-xs text-navy hover:text-gold"><Edit className="w-3.5 h-3.5" /> Edit</Link>
                </td>
              </AdminTr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">
                {products.length === 0 ? (
                  <>No products yet. <Link href="/admin/products/new" className="underline text-gold">Add your first product</Link></>
                ) : (
                  "No products match your search/filters."
                )}
              </td></tr>
            )}
          </tbody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
