"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, Search, Star, X } from "lucide-react";
import { slugify } from "@/lib/utils";
import CategorySelect from "@/components/admin/CategorySelect";
import { descendantIds, flattenTree, pathLabel, pathTo } from "@/lib/category-tree";

type C = { id: string; name: string; parent_id: string | null; sort_order?: number | null; is_active?: boolean };

/**
 * Product form → Categories.
 * - Every category at every depth, as a foldable tree with search.
 * - The first ticked category is the "main" one (breadcrumbs, product URL); a star makes any other the main one.
 * - A product in "Party frocks" already shows on Frocks, Girls and Clothing pages, so the parents need no tick.
 * - Missing category? Type it in the search box and create it right here.
 */
export default function CategoryPicker({
  categories: initial,
  value,
  onChange,
}: {
  categories: C[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [cats, setCats] = useState<C[]>(initial);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // Start folded, except the branches that hold a ticked category.
    const open = new Set(value.flatMap((id) => pathTo(initial, id).map((c) => c.id)));
    return new Set(initial.filter((c) => !open.has(c.id)).map((c) => c.id));
  });
  const [newParent, setNewParent] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => flattenTree(cats), [cats]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s) {
      const keep = new Set<string>();
      rows.forEach(({ cat }) => { if (cat.name.toLowerCase().includes(s)) pathTo(cats, cat.id).forEach((a) => keep.add(a.id)); });
      return rows.filter((r) => keep.has(r.cat.id));
    }
    const hidden = new Set<string>();
    collapsed.forEach((id) => descendantIds(cats, id).forEach((d) => hidden.add(d)));
    return rows.filter((r) => !hidden.has(r.cat.id));
  }, [rows, q, collapsed, cats]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const makeMain = (id: string) => onChange([id, ...value.filter((x) => x !== id)]);
  const exact = q.trim() && cats.some((c) => c.name.trim().toLowerCase() === q.trim().toLowerCase());

  const create = async () => {
    const name = q.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name), parent_id: newParent, is_active: true, display_shape: "circle", is_featured_in_menu: false, sort_order: 99 }),
    });
    setCreating(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.ok === false) return toast.error(j.error || "Could not create the category");
    const c: C = { id: j.id, name, parent_id: newParent, sort_order: 99, is_active: true };
    setCats((prev) => [...prev, c]);
    onChange([...value, c.id]);
    setQ("");
    if (newParent) setCollapsed((prev) => { const n = new Set(prev); pathTo(cats, newParent).forEach((a) => n.delete(a.id)); return n; });
    toast.success(`Created “${pathLabel([...cats, c], c.id)}” and ticked it`);
  };

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 space-y-1.5" aria-label="Chosen categories">
          {value.map((id, i) => (
            <li key={id} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${i === 0 ? "bg-navy text-white" : "bg-cream text-navy"}`}>
              <button type="button" onClick={() => makeMain(id)} title={i === 0 ? "Main category" : "Make this the main category"} aria-label="Make main category" className="shrink-0">
                <Star className={`w-3.5 h-3.5 ${i === 0 ? "fill-brand-yellow text-brand-yellow" : "text-navy/40 hover:text-gold-text"}`} />
              </button>
              <span className="flex-1 min-w-0" title={pathLabel(cats, id)}>
                <span className="block truncate font-semibold">{cats.find((c) => c.id === id)?.name ?? "(deleted category)"}</span>
                {pathTo(cats, id).length > 1 && <span className="block truncate text-[10px] opacity-70">{pathTo(cats, id).slice(0, -1).map((c) => c.name).join(" › ")}</span>}
              </span>
              {i === 0 && <span className="text-[9px] font-bold uppercase tracking-wider text-brand-yellow">Main</span>}
              <button type="button" onClick={() => toggle(id)} aria-label="Remove" className="shrink-0 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search or create a category…" data-testid="cat-picker-search" className="w-full border border-neutral-200 rounded-lg pl-8 pr-2 py-2 text-xs outline-none focus:border-gold" />
      </div>

      {q.trim() && !exact && (
        <div className="mt-2 rounded-lg border border-dashed border-gold/60 bg-gold/5 p-2.5 space-y-2">
          <p className="text-xs text-navy">Create <b>“{q.trim()}”</b> inside:</p>
          <CategorySelect categories={cats} value={newParent} onChange={setNewParent} topLabel="— Top level —" className="w-full border border-neutral-200 rounded px-2 py-1.5 text-xs bg-white" ariaLabel="Parent for the new category" />
          <button type="button" onClick={create} disabled={creating} data-testid="cat-picker-create" className="w-full inline-flex items-center justify-center gap-1 rounded bg-navy text-white text-xs font-semibold py-1.5 disabled:opacity-60">
            <Plus className="w-3.5 h-3.5" /> {creating ? "Creating…" : "Create & tick"}
          </button>
        </div>
      )}

      <ul className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-neutral-100 py-1" role="tree">
        {shown.map(({ cat, depth, hasChildren }) => {
          const open = !collapsed.has(cat.id) || !!q.trim();
          const on = value.includes(cat.id);
          return (
            <li key={cat.id} role="treeitem" aria-selected={on} className="flex items-center gap-1 pr-2 hover:bg-cream/60" style={{ paddingLeft: 4 + depth * 16 }}>
              {hasChildren ? (
                <button type="button" onClick={() => setCollapsed((prev) => { const n = new Set(prev); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })} aria-label={open ? "Fold" : "Open"} className="w-5 h-6 grid place-items-center text-navy/60 shrink-0">
                  {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              ) : <span className="w-5 shrink-0" />}
              <label className="flex-1 flex items-center gap-2 py-1.5 text-xs cursor-pointer min-w-0">
                <input type="checkbox" checked={on} onChange={() => toggle(cat.id)} />
                <span className={`truncate ${depth === 0 ? "font-semibold text-navy" : "text-ink"} ${cat.is_active === false ? "opacity-50" : ""}`}>{cat.name}{cat.is_active === false ? " (off)" : ""}</span>
              </label>
            </li>
          );
        })}
        {shown.length === 0 && <li className="px-3 py-3 text-xs text-neutral-400">No category matches.</li>}
      </ul>
      <p className="mt-2 text-[11px] text-neutral-500 leading-snug">Tick the most specific one (e.g. <i>Frocks</i>) — the product also shows on every category above it automatically.</p>
    </div>
  );
}
