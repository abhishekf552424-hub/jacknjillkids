"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, Minus, Plus, Check, Loader2, PackageX, ImageOff } from "lucide-react";
import { AdminPageHeader, AdminCard, EmptyState } from "@/components/admin/ui";

type Row = { id: string; sku: string | null; size: string | null; color: string | null; stock: number; product: string; product_id: string; status: string; image: string | null };

const FILTERS = [
  { key: "", label: "All sizes" },
  { key: "low", label: "Low (5 or less)" },
  { key: "out", label: "Sold out" },
];

export default function StockClient({ initialFilter, initialQuery, canEditProducts }: { initialFilter: string; initialQuery: string; canEditProducts: boolean }) {
  const [filter, setFilter] = useState(initialFilter);
  const [q, setQ] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filter) params.set("filter", filter);
    if (query) params.set("q", query);
    try {
      const r = await fetch(`/api/admin/stock?${params}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not load stock");
      setRows(j.rows);
      setTotal(j.total);
      setPerPage(j.perPage);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Products"
        title="Stock"
        subtitle="Type the number of pieces you have now and press Save. The website updates straight away."
      />

      <AdminCard className="p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            className="relative flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product name or SKU"
              className="w-full rounded-lg border border-line bg-cream/50 pl-9 pr-3 py-2.5 text-[15px] outline-none focus:border-doodle focus:bg-white"
            />
          </form>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border ${filter === f.key ? "bg-navy text-white border-navy" : "bg-white text-navy border-line hover:bg-cream"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      {loading && rows.length === 0 ? (
        <AdminCard className="p-10 text-center text-muted">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading stock…
        </AdminCard>
      ) : rows.length === 0 ? (
        <EmptyState icon={PackageX} title="Nothing here" text={filter === "out" ? "No size is sold out. Well done!" : "No sizes match your search."} />
      ) : (
        <AdminCard className="divide-y divide-line">
          {rows.map((r) => (
            <StockRow key={r.id} row={r} canEditProducts={canEditProducts} />
          ))}
        </AdminCard>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-40">
            Previous
          </button>
          <span className="text-muted">
            Page {page} of {pages} · {total} sizes
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-navy disabled:opacity-40">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function StockRow({ row, canEditProducts }: { row: Row; canEditProducts: boolean }) {
  const [saved, setSaved] = useState(row.stock);
  const [value, setValue] = useState(String(row.stock));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const n = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 100000;
  const dirty = valid && n !== saved;

  const save = async () => {
    if (!dirty) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variant_id: row.id, expected: saved, stock_qty: n }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Could not save");
      setSaved(j.stock);
      setValue(String(j.stock));
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
      if (j.stock !== n) toast.info(`Saved. An order came in meanwhile, so stock is now ${j.stock}.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const step = (d: number) => setValue(String(Math.max(0, (valid ? n : saved) + d)));
  const variant = [row.size, row.color].filter(Boolean).join(" · ") || "One size";
  const tone = saved <= 0 ? "text-error" : saved <= 5 ? "text-warning" : "text-success";

  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-4">
      <div className="w-12 h-12 rounded-lg bg-cream overflow-hidden shrink-0 flex items-center justify-center">
        {row.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <ImageOff className="w-5 h-5 text-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1 basis-[55%]">
        {canEditProducts ? (
          <Link href={`/admin/products/${row.product_id}`} className="font-semibold text-navy hover:underline line-clamp-1">
            {row.product}
          </Link>
        ) : (
          <p className="font-semibold text-navy line-clamp-1">{row.product}</p>
        )}
        <p className="text-sm text-muted">
          {variant}
          {row.sku ? ` · ${row.sku}` : ""}
        </p>
        <p className={`text-xs font-bold mt-0.5 ${tone}`}>{saved <= 0 ? "Sold out" : saved <= 5 ? `Only ${saved} left` : `${saved} in stock`}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
        <button onClick={() => step(-1)} className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-navy hover:bg-cream" aria-label={`One less ${row.product} ${variant}`}>
          <Minus className="w-4 h-4" />
        </button>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          aria-label={`Stock for ${row.product} ${variant}`}
          className={`w-16 h-9 rounded-lg border text-center font-bold text-navy outline-none ${dirty ? "border-doodle bg-sky" : "border-line"}`}
        />
        <button onClick={() => step(1)} className="w-9 h-9 rounded-lg border border-line flex items-center justify-center text-navy hover:bg-cream" aria-label={`One more ${row.product} ${variant}`}>
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={save}
          disabled={!dirty || busy}
          className={`ml-1 h-9 min-w-[64px] rounded-lg px-3 text-sm font-semibold flex items-center justify-center ${
            done ? "bg-success text-white" : dirty ? "bg-action hover:bg-action-hover text-white" : "bg-neutral-100 text-neutral-400"
          }`}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : "Save"}
        </button>
      </div>
    </div>
  );
}
