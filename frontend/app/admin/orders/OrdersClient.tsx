"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { Search } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminThead, AdminTh, AdminTr, StatusPill, BulkActionBar } from "@/components/admin/ui";

const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warn" | "gold"> = {
  delivered: "success",
  confirmed: "gold",
  packed: "gold",
  shipped: "gold",
  out_for_delivery: "gold",
  cancelled: "danger",
  return_requested: "danger",
  return_approved: "danger",
  refunded: "danger",
};

const QUICK_TABS = [
  { label: "All", status: "" },
  { label: "New", status: "placed" },
  { label: "To pack", status: "confirmed" },
  { label: "Ready to ship", status: "packed" },
  { label: "Shipped", status: "shipped" },
  { label: "Delivered", status: "delivered" },
  { label: "Returns", status: "return_requested" },
  { label: "Cancelled", status: "cancelled" },
];

const BULK_STATUS_OPTIONS = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

export default function OrdersClient({ rows: initialRows, initialFilters }: { rows: any[]; initialFilters: { q?: string; status?: string; payment?: string; from?: string; to?: string } }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [f, setF] = useState({
    q: initialFilters.q || "",
    status: initialFilters.status || "",
    payment: initialFilters.payment || "",
    from: initialFilters.from || "",
    to: initialFilters.to || "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(BULK_STATUS_OPTIONS[0]);
  const [busy, setBusy] = useState(false);
  const [sortKey, setSortKey] = useState<"created_at" | "total">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // The server sends new rows whenever the URL filters change.
  useEffect(() => {
    setRows(initialRows);
    setSelected(new Set());
  }, [initialRows]);
  useEffect(() => {
    setF({
      q: initialFilters.q || "",
      status: initialFilters.status || "",
      payment: initialFilters.payment || "",
      from: initialFilters.from || "",
      to: initialFilters.to || "",
    });
  }, [initialFilters.q, initialFilters.status, initialFilters.payment, initialFilters.from, initialFilters.to]);

  const goStatus = (status: string) => {
    const params = new URLSearchParams();
    Object.entries({ ...f, status }).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/admin/orders${params.toString() ? "?" + params.toString() : ""}`);
  };

  const apply = () => {
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v); });
    router.push(`/admin/orders${params.toString() ? "?" + params.toString() : ""}`);
  };
  const reset = () => { setF({ q: "", status: "", payment: "", from: "", to: "" }); router.push("/admin/orders"); };

  const toggleSort = (key: "created_at" | "total") => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortedRows = [...rows].sort((a, b) => {
    const cmp = sortKey === "total" ? a.total - b.total : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => (prev.size === sortedRows.length ? new Set() : new Set(sortedRows.map((r) => r.id))));
  };

  const applyBulkStatus = async () => {
    setBusy(true);
    const ids = Array.from(selected);
    const res = await fetch("/api/admin/orders/bulk-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, status: bulkStatus }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json();
      toast.error(j.error || "Bulk update failed");
      return;
    }
    setRows((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: bulkStatus } : r)));
    toast.success(`Updated ${ids.length} order(s) to "${bulkStatus.replace(/_/g, " ")}"`);
    setSelected(new Set());
  };

  return (
    <div>
      <AdminPageHeader eyebrow="Orders & customers" title="Orders" />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 -mx-1 px-1" role="tablist" aria-label="Order status">
        {QUICK_TABS.map((t) => {
          const active = (f.status || "") === t.status;
          return (
            <button
              key={t.label}
              role="tab"
              aria-selected={active}
              onClick={() => goStatus(t.status)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${active ? "bg-navy text-white border-navy" : "bg-white text-navy border-line hover:bg-cream"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <AdminCard className="p-3 md:p-4 mb-4">
        <div className="grid gap-2 md:grid-cols-[1.5fr_repeat(4,1fr)_auto_auto]">
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
      </AdminCard>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="text-xs rounded px-2 py-1.5 text-navy">
          {BULK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button disabled={busy} onClick={applyBulkStatus} className="bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-xs">
          Update status
        </button>
      </BulkActionBar>

      <AdminCard>
        <AdminTable>
          <AdminThead>
            <AdminTh><input type="checkbox" checked={selected.size > 0 && selected.size === sortedRows.length} onChange={toggleAll} /></AdminTh>
            <AdminTh>Order</AdminTh>
            <AdminTh>Customer</AdminTh>
            <AdminTh><button onClick={() => toggleSort("total")} className="hover:text-navy">Total {sortKey === "total" && (sortDir === "asc" ? "↑" : "↓")}</button></AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh><button onClick={() => toggleSort("created_at")} className="hover:text-navy">Placed {sortKey === "created_at" && (sortDir === "asc" ? "↑" : "↓")}</button></AdminTh>
          </AdminThead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-neutral-400">No orders match.</td></tr>
            ) : sortedRows.map((o: any) => (
              <AdminTr key={o.id}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} /></td>
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.order_number}`} className="text-navy font-medium hover:underline">{o.order_number}</Link></td>
                <td className="px-4 py-3">{o.shipping_address?.full_name || "—"}<div className="text-[10px] text-neutral-400">{o.shipping_address?.phone}</div></td>
                <td className="px-4 py-3">{formatINR(o.total)}</td>
                <td className="px-4 py-3 uppercase text-xs">{o.payment_method}</td>
                <td className="px-4 py-3"><StatusPill label={o.status.replace(/_/g, " ")} tone={STATUS_TONE[o.status] ?? "neutral"} /></td>
                <td className="px-4 py-3 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
              </AdminTr>
            ))}
          </tbody>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
