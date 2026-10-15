"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Search, CheckCircle2, XCircle, ChevronRight, ChevronDown, FolderPlus, Layers, EyeOff, ListPlus, ImagePlus, SlidersHorizontal } from "lucide-react";
import { Fragment } from "react";
import { slugify } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";
import CategorySelect from "@/components/admin/CategorySelect";
import { AdminPageHeader, AdminCard, BulkActionBar } from "@/components/admin/ui";
import { childrenMap, descendantIds, flattenTree, pathLabel, pathTo, visibleCategories } from "@/lib/category-tree";

type C = {
  id?: string;
  parent_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  display_shape: "circle" | "square";
  is_featured_in_menu: boolean;
  sort_order: number;
  is_active: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
};
/** A row on screen: `key` is the real id once saved, "tmp-…" before that. */
type Row = C & { key: string; dirty?: boolean };

let tmpN = 0;
const tmpKey = () => `tmp-${Date.now()}-${++tmpN}`;
const blank = (parent_id: string | null, sort_order: number): Row => ({
  key: tmpKey(),
  parent_id,
  name: "",
  slug: "",
  image_url: "",
  display_shape: "circle",
  is_featured_in_menu: false,
  sort_order,
  is_active: true,
  dirty: true,
});
const splitNames = (s: string) =>
  Array.from(new Set(s.split(/[\n,]+/).map((x) => x.trim()).filter(Boolean)));

export default function CategoriesClient({ initial, productCounts = {} }: { initial: C[]; productCounts?: Record<string, number> }) {
  const [rows, setRows] = useState<Row[]>(initial.map((c) => ({ ...c, key: c.id! })));
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // Branches start open; the admin can fold them.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [quickParent, setQuickParent] = useState<string | null>(null);
  const [quickNames, setQuickNames] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const focusKey = useRef<string | null>(null);
  // Row whose picture & SEO panel is open below it.
  const [detail, setDetail] = useState<string | null>(null);

  // Tree helpers work on {id, parent_id, name, …}; unsaved rows use their tmp key as id.
  const treeCats = useMemo(() => rows.map((r) => ({ ...r, id: r.key })), [rows]);
  const saved = useMemo(() => treeCats.filter((c) => !c.key.startsWith("tmp-")), [treeCats]);
  const kids = useMemo(() => childrenMap(treeCats), [treeCats]);
  const shownOnSite = useMemo(() => new Set(visibleCategories(saved).map((c) => c.id)), [saved]);
  const dirtyCount = rows.filter((r) => r.dirty).length;

  const nextOrder = (parent: string | null) =>
    Math.max(0, ...rows.filter((r) => (r.parent_id ?? null) === parent).map((r) => Number(r.sort_order) || 0)) + 1;

  // Rows in tree order. While searching: matches plus the branch above them, all opened.
  const visibleRows = useMemo(() => {
    const all = flattenTree(treeCats);
    const q = search.trim().toLowerCase();
    if (q) {
      const keep = new Set<string>();
      for (const { cat } of all) {
        if (cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q)) {
          pathTo(treeCats, cat.id).forEach((a) => keep.add(a.id));
        }
      }
      return all.filter((r) => keep.has(r.cat.id));
    }
    const hidden = new Set<string>();
    for (const k of collapsed) descendantIds(treeCats, k).forEach((d) => hidden.add(d));
    return all.filter((r) => !hidden.has(r.cat.id));
  }, [treeCats, collapsed, search]);

  const patch = (key: string, p: Partial<C>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...p, dirty: true } : r)));

  const focusSoon = (key: string) => {
    focusKey.current = key;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-cat-name="${key}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    });
  };

  const addTop = () => {
    const r = blank(null, nextOrder(null));
    setRows((prev) => [...prev, r]);
    setSearch("");
    focusSoon(r.key);
  };

  const addSub = (parent: Row) => {
    if (parent.key.startsWith("tmp-")) return toast.error("Save this category first, then add sub-categories inside it.");
    const r = blank(parent.key, nextOrder(parent.key));
    setRows((prev) => [...prev, r]);
    setCollapsed((prev) => { const n = new Set(prev); n.delete(parent.key); return n; });
    setSearch("");
    focusSoon(r.key);
  };

  const toggleBranch = (key: string) =>
    setCollapsed((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const collapseAll = () => setCollapsed(new Set(rows.filter((r) => (kids.get(r.key) ?? []).length).map((r) => r.key)));

  /** Saves one row. Returns true when it worked. */
  const saveRow = async (r: Row, quiet = false): Promise<boolean> => {
    if (!r.name.trim()) {
      toast.error("Please type a category name before saving.");
      focusSoon(r.key);
      return false;
    }
    const isNew = r.key.startsWith("tmp-");
    setSaving(r.key);
    const { key: _k, dirty: _d, id: _id, ...body } = r;
    const res = await fetch("/api/admin/categories" + (isNew ? "" : `/${r.key}`), {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, name: r.name.trim(), slug: r.slug || slugify(r.name) }),
    });
    setSaving(null);
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.ok === false) {
      toast.error(`${r.name || "Category"}: ${j.error || "could not save"}`);
      return false;
    }
    const newKey = isNew ? j.id : r.key;
    setRows((prev) =>
      prev.map((x) =>
        x.key === r.key
          ? { ...x, id: newKey, key: newKey, slug: j.slug ?? (x.slug || slugify(x.name)), name: x.name.trim(), dirty: false }
          : x.parent_id === r.key ? { ...x, parent_id: newKey } : x,
      ),
    );
    if (!quiet) toast.success(`Saved “${r.name.trim()}”`);
    return true;
  };

  const saveAll = async () => {
    // Parents before children, so a new branch saves in one go.
    const order = flattenTree(treeCats).map((x) => x.cat.key);
    const todo = rows.filter((r) => r.dirty).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    let ok = 0;
    for (const r of todo) if (await saveRow(r, true)) ok++;
    if (ok) toast.success(`Saved ${ok} categor${ok === 1 ? "y" : "ies"}`);
  };

  const remove = async (r: Row) => {
    if (r.key.startsWith("tmp-")) return setRows((prev) => prev.filter((x) => x.key !== r.key));
    const subs = (kids.get(r.key) ?? []).length;
    const items = productCounts[r.key] ?? 0;
    const parent = r.parent_id ? rows.find((x) => x.key === r.parent_id) : undefined;
    const where = parent ? `“${parent.name}”` : "the top level";
    const lines = [`Delete “${r.name}”?`];
    if (subs) lines.push(`• Its ${subs} sub-categor${subs === 1 ? "y" : "ies"} will move up to ${where}.`);
    if (items) lines.push(parent ? `• Its ${items} product${items === 1 ? "" : "s"} will move to “${parent.name}”.` : `• Its ${items} product${items === 1 ? "" : "s"} will stay in the shop but leave this category.`);
    if (!confirm(lines.join("\n"))) return;
    const res = await fetch(`/api/admin/categories/${r.key}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || j.ok === false) return toast.error(j.error || "Could not delete");
    setRows((prev) => prev.filter((x) => x.key !== r.key).map((x) => (x.parent_id === r.key ? { ...x, parent_id: r.parent_id ?? null } : x)));
    toast.success("Deleted");
  };

  const quickAdd = async () => {
    const names = splitNames(quickNames);
    if (!names.length) return toast.error("Type one or more names — one per line, or separated by commas.");
    setQuickBusy(true);
    let order = nextOrder(quickParent);
    const created: Row[] = [];
    for (const name of names) {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name), parent_id: quickParent, sort_order: order, is_active: true, display_shape: "circle", is_featured_in_menu: false }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.ok === false) { toast.error(`${name}: ${j.error || "could not add"}`); continue; }
      created.push({ ...blank(quickParent, order), key: j.id, id: j.id, name, slug: j.slug, dirty: false });
      order++;
    }
    setQuickBusy(false);
    if (created.length) {
      setRows((prev) => [...prev, ...created]);
      if (quickParent) setCollapsed((prev) => { const n = new Set(prev); pathTo(saved, quickParent).forEach((a) => n.delete(a.id)); return n; });
      setQuickNames("");
      toast.success(`Added ${created.length} categor${created.length === 1 ? "y" : "ies"}${quickParent ? ` inside “${pathLabel(saved, quickParent)}”` : ""}`);
    }
  };

  const toggleOne = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectableIds = visibleRows.map(({ cat }) => cat.key).filter((k) => !k.startsWith("tmp-"));
  const toggleAll = () => setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)));

  const bulkAction = async (action: "activate" | "deactivate" | "delete") => {
    let ids = Array.from(selected);
    if (action === "delete" && !confirm(`Delete ${ids.length} categor${ids.length === 1 ? "y" : "ies"}?\nTheir sub-categories and products move up one level.`)) return;
    setBulkBusy(true);
    const done: string[] = [];
    let firstError = "";
    for (const id of ids) {
      const r = action === "delete"
        ? await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
        : await fetch(`/api/admin/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: action === "activate" }) });
      if (r.ok) done.push(id);
      else if (!firstError) firstError = (await r.json().catch(() => ({})))?.error || "Could not update";
    }
    setBulkBusy(false);
    if (firstError) toast.error(`${ids.length - done.length} not updated: ${firstError}`);
    ids = done;
    if (!ids.length) return;
    if (action === "delete") {
      setRows((prev) => {
        const byKey = new Map(prev.map((r) => [r.key, r]));
        // climb past every deleted ancestor
        const up = (p: string | null): string | null => (p && ids.includes(p) ? up(byKey.get(p)?.parent_id ?? null) : p);
        return prev.filter((r) => !ids.includes(r.key)).map((r) => ({ ...r, parent_id: up(r.parent_id) }));
      });
    } else {
      setRows((prev) => prev.map((r) => (ids.includes(r.key) ? { ...r, is_active: action === "activate" } : r)));
    }
    toast.success(`Updated ${ids.length} categor${ids.length === 1 ? "y" : "ies"}`);
    setSelected(new Set());
  };

  const input = "bg-cream rounded px-2 py-1 border border-navy/10 outline-none focus:border-gold";

  return (
    <div>
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="Categories"
        subtitle="Build categories as deep as you need — e.g. Clothing › Girls › Frocks › Party frocks. Products in a sub-category also show on every category above it."
        action={
          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <button onClick={saveAll} data-testid="cat-save-all" className="bg-action text-white rounded px-4 py-2.5 text-sm font-semibold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save {dirtyCount} change{dirtyCount === 1 ? "" : "s"}
              </button>
            )}
            <button onClick={addTop} data-testid="cat-add-top" className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add main category</button>
          </div>
        }
      />

      {/* Quick add: many names at once, inside any category */}
      <AdminCard className="p-4 mb-4">
        <div className="flex items-center gap-2 text-navy font-semibold text-sm mb-3"><ListPlus className="w-4 h-4" /> Quick add — several categories at once</div>
        <div className="grid gap-3 md:grid-cols-[minmax(220px,300px)_1fr_auto] md:items-start">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Put them inside</span>
            <CategorySelect categories={saved} value={quickParent} onChange={setQuickParent} topLabel="— Top level (main categories) —" className={`${input} mt-1 w-full py-2 text-sm`} ariaLabel="Parent for quick add" />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Names (one per line, or comma separated)</span>
            <textarea
              value={quickNames}
              onChange={(e) => setQuickNames(e.target.value)}
              rows={2}
              data-testid="cat-quick-names"
              placeholder="Frocks, Tops & T-shirts, Leggings, Ethnic sets"
              className={`${input} mt-1 w-full py-2 text-sm`}
            />
          </label>
          <button onClick={quickAdd} disabled={quickBusy} data-testid="cat-quick-add" className="md:mt-5 bg-navy text-white rounded px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            <FolderPlus className="w-4 h-4" /> {quickBusy ? "Adding…" : `Add ${splitNames(quickNames).length || ""}`.trim()}
          </button>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/10 text-sm outline-none focus:border-gold bg-white" />
        </div>
        <button onClick={() => setCollapsed(new Set())} className="text-xs font-semibold text-navy underline-offset-4 hover:underline">Expand all</button>
        <button onClick={collapseAll} className="text-xs font-semibold text-navy underline-offset-4 hover:underline">Collapse all</button>
        <span className="text-xs text-muted ml-auto"><Layers className="w-3.5 h-3.5 inline -mt-0.5" /> {saved.length} categories</span>
      </div>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <button disabled={bulkBusy} onClick={() => bulkAction("activate")} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Activate</button>
        <button disabled={bulkBusy} onClick={() => bulkAction("deactivate")} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-xs"><XCircle className="w-3.5 h-3.5" /> Deactivate</button>
        <button disabled={bulkBusy} onClick={() => bulkAction("delete")} className="flex items-center gap-1 bg-error/80 hover:bg-error rounded px-3 py-1.5 text-xs"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
      </BulkActionBar>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-navy">
              <tr>
                <th className="px-3 py-2"><input type="checkbox" aria-label="Select all" checked={selected.size > 0 && selected.size === selectableIds.length} onChange={toggleAll} /></th>
                <th className="text-left px-3 py-2 min-w-[300px]">Name</th>
                <th className="text-left px-3 py-2">Inside (parent)</th>
                <th className="text-left px-3 py-2">Slug</th>
                <th className="text-left px-3 py-2">Picture & SEO</th>
                <th className="text-left px-3 py-2">Shape</th>
                <th className="text-left px-3 py-2" title="Tick to show this category in the homepage “Shop by category” row">On homepage</th>
                <th className="text-left px-3 py-2" title="Lower number shows first among its sisters">Order</th>
                <th className="text-left px-3 py-2">Active</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ cat, depth }) => {
                const r = cat as unknown as Row;
                const childCount = (kids.get(r.key) ?? []).length;
                const isNew = r.key.startsWith("tmp-");
                const open = !collapsed.has(r.key) || !!search.trim();
                const hiddenByParent = !isNew && r.is_active && !shownOnSite.has(r.key);
                const items = productCounts[r.key] ?? 0;
                return (
                  <Fragment key={r.key}>
                  <tr data-testid={`cat-row-${r.slug || r.key}`} className={`border-t border-navy/5 align-top ${r.dirty ? "bg-butter/40" : depth === 0 ? "bg-white" : "bg-cream/20"} hover:bg-cream/50`}>
                    <td className="px-3 py-2.5">{!isNew && <input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.key)} onChange={() => toggleOne(r.key)} />}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 22 }}>
                        {childCount > 0 ? (
                          <button onClick={() => toggleBranch(r.key)} aria-label={open ? `Fold ${r.name}` : `Open ${r.name}`} aria-expanded={open} className="w-6 h-6 grid place-items-center rounded hover:bg-navy/5 text-navy shrink-0">
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="w-6 shrink-0 text-center text-navy/25">{depth ? "└" : "•"}</span>
                        )}
                        <input
                          data-cat-name={r.key}
                          value={r.name}
                          onChange={(e) => patch(r.key, { name: e.target.value })}
                          onKeyDown={(e) => { if (e.key === "Enter") saveRow(r); }}
                          placeholder={depth ? "Sub-category name" : "Category name"}
                          className={`${input} w-44 ${depth === 0 ? "font-semibold" : ""}`}
                        />
                        <span className="flex flex-col gap-0.5 text-[10px] leading-tight text-muted whitespace-nowrap">
                          {childCount > 0 && <span>{childCount} sub</span>}
                          <span title="Products directly in this category">{items} product{items === 1 ? "" : "s"}</span>
                        </span>
                      </div>
                      {hiddenByParent && (
                        <p className="mt-1 text-[11px] text-error flex items-center gap-1" style={{ paddingLeft: depth * 22 + 30 }}><EyeOff className="w-3 h-3" /> Hidden on the shop — a category above it is switched off</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <CategorySelect
                        categories={saved}
                        value={r.parent_id}
                        forId={isNew ? null : r.key}
                        onChange={(pid) => patch(r.key, { parent_id: pid, sort_order: nextOrder(pid) })}
                        className={`${input} text-xs max-w-[200px]`}
                        ariaLabel={`Parent of ${r.name || "new category"}`}
                      />
                    </td>
                    <td className="px-3 py-2"><input value={r.slug} onChange={(e) => patch(r.key, { slug: slugify(e.target.value) })} placeholder="auto" className={`${input} w-32 text-xs`} /></td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setDetail(detail === r.key ? null : r.key)} aria-expanded={detail === r.key} title="Picture, page title and description" className={`flex items-center gap-2 rounded-lg border px-1.5 py-1 text-xs font-semibold ${detail === r.key ? "border-navy bg-white text-navy" : "border-navy/10 text-navy/70 hover:border-navy/40"}`}>
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.image_url} alt="" className="w-7 h-7 rounded-full object-cover bg-cream" />
                        ) : (
                          <span className="grid place-items-center w-7 h-7 rounded-full bg-cream"><ImagePlus className="w-3.5 h-3.5" /></span>
                        )}
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <select value={r.display_shape} onChange={(e) => patch(r.key, { display_shape: e.target.value as C["display_shape"] })} className={`${input} text-xs`}>
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" aria-label="Show on homepage" checked={r.is_featured_in_menu} onChange={(e) => patch(r.key, { is_featured_in_menu: e.target.checked })} /></td>
                    <td className="px-3 py-2"><input type="number" value={r.sort_order} onChange={(e) => patch(r.key, { sort_order: Number(e.target.value) })} className={`${input} w-14`} /></td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" aria-label="Active" checked={r.is_active} onChange={(e) => patch(r.key, { is_active: e.target.checked })} /></td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button onClick={() => addSub(r)} data-testid={`cat-add-sub-${r.slug || r.key}`} title="Add a sub-category inside this one" className="inline-flex items-center gap-1 rounded-full border border-navy/15 px-2.5 py-1 text-xs font-semibold text-navy hover:bg-navy hover:text-white mr-1">
                        <Plus className="w-3 h-3" /> Sub
                      </button>
                      <button onClick={() => saveRow(r)} disabled={saving === r.key} title="Save" aria-label={`Save ${r.name}`} className={`px-2 ${r.dirty ? "text-action" : "text-gold-text"} hover:text-navy disabled:opacity-40`}><Save className="w-4 h-4 inline" /></button>
                      <button onClick={() => remove(r)} title="Delete" aria-label={`Delete ${r.name}`} className="text-error px-2"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                  {detail === r.key && (
                    <tr className="bg-cream/40">
                      <td />
                      <td colSpan={9} className="px-3 pb-4 pt-1">
                        <div className="grid gap-4 md:grid-cols-[220px_1fr] rounded-xl border border-line bg-white p-4" style={{ marginLeft: depth * 22 }}>
                          <ImageUploader value={r.image_url ?? ""} onChange={(url) => patch(r.key, { image_url: url })} folder="categories" label="Category picture" showUrlField />
                          <div className="space-y-3">
                            <label className="block">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Page heading / Google title (optional)</span>
                              <input value={r.meta_title ?? ""} onChange={(e) => patch(r.key, { meta_title: e.target.value })} placeholder={`${r.name || "Category"} for kids — shop online in Kolhapur`} className={`${input} mt-1 w-full py-2 text-sm`} />
                            </label>
                            <label className="block">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Short description under the heading (optional)</span>
                              <textarea rows={2} value={r.meta_description ?? ""} onChange={(e) => patch(r.key, { meta_description: e.target.value })} placeholder="e.g. Soft cotton frocks for 1–8 years, perfect for birthdays and festivals." className={`${input} mt-1 w-full py-2 text-sm`} />
                            </label>
                            <button onClick={() => saveRow(rows.find((x) => x.key === r.key) ?? r)} className="bg-navy text-white rounded px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save “{r.name || "category"}”</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-400">{search ? "No categories match." : "No categories yet — add your first main category."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
      <p className="mt-3 text-xs text-muted">Tip: a yellow row has unsaved changes. Press Enter in a name box to save that row, or use “Save changes” at the top to save them all.</p>
    </div>
  );
}
