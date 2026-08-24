"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Search, CheckCircle2, XCircle } from "lucide-react";
import { slugify } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";
import { AdminPageHeader, AdminCard, BulkActionBar } from "@/components/admin/ui";

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
};

export default function CategoriesClient({ initial }: { initial: C[] }) {
  const [cats, setCats] = useState<C[]>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const newNameRef = useRef<HTMLInputElement | null>(null);

  const addNew = () => {
    setCats((prev) => [
      ...prev,
      { parent_id: null, name: "", slug: "", image_url: "", display_shape: "circle", is_featured_in_menu: false, sort_order: prev.length + 1, is_active: true } as C,
    ]);
    toast.message("New category row added below — enter a name and click Save.");
    requestAnimationFrame(() => {
      newNameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      newNameRef.current?.focus();
    });
  };

  const update = (i: number, patch: Partial<C>) => setCats(cats.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const save = async (c: C, i: number) => {
    if (!c.name.trim()) {
      toast.error("Please enter a category name before saving.");
      return;
    }
    setSaving(c.id ?? "new");
    const r = await fetch("/api/admin/categories" + (c.id ? `/${c.id}` : ""), {
      method: c.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, slug: c.slug || slugify(c.name) }),
    });
    setSaving(null);
    if (!r.ok) {
      const j = await r.json();
      toast.error(j.error || "Save failed");
      return;
    }
    const j = await r.json();
    toast.success("Saved");
    setCats((prev) => prev.map((x, idx) => (idx === i ? { ...x, id: j.id ?? x.id, slug: j.slug ?? x.slug } : x)));
  };

  const remove = async (i: number, c: C) => {
    if (!c.id) return setCats(cats.filter((_, j) => j !== i));
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    setCats(cats.filter((_, j) => j !== i));
    toast.success("Deleted");
  };

  const parents = cats.filter((c) => !c.parent_id);

  const filteredIdx = useMemo(() => {
    const q = search.toLowerCase();
    return cats.map((c, i) => ({ c, i })).filter(({ c }) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [cats, search]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectableIds = filteredIdx.map(({ c }) => c.id).filter(Boolean) as string[];
  const toggleAll = () => setSelected((prev) => (prev.size === selectableIds.length ? new Set() : new Set(selectableIds)));

  const bulkAction = async (action: "activate" | "deactivate" | "delete") => {
    const ids = Array.from(selected);
    if (action === "delete" && !confirm(`Delete ${ids.length} categor${ids.length === 1 ? "y" : "ies"}?`)) return;
    setBulkBusy(true);
    // Categories are typically a small list (tens, not thousands), so
    // sequential calls to the existing per-row endpoints keep this simple
    // and safe rather than adding a separate bulk API route.
    for (const id of ids) {
      if (action === "delete") {
        await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/categories/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: action === "activate" }),
        });
      }
    }
    setBulkBusy(false);
    if (action === "delete") {
      setCats((prev) => prev.filter((c) => !c.id || !ids.includes(c.id)));
    } else {
      setCats((prev) => prev.map((c) => (c.id && ids.includes(c.id) ? { ...c, is_active: action === "activate" } : c)));
    }
    toast.success(`Updated ${ids.length} categor${ids.length === 1 ? "y" : "ies"}`);
    setSelected(new Set());
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Taxonomy"
        title="Categories"
        action={<button onClick={addNew} className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>}
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-navy/10 text-sm outline-none focus:border-gold bg-white" />
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
                <th className="px-3 py-2"><input type="checkbox" checked={selected.size > 0 && selected.size === selectableIds.length} onChange={toggleAll} /></th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Slug</th>
                <th className="text-left px-3 py-2">Parent</th>
                <th className="text-left px-3 py-2">Image URL</th>
                <th className="text-left px-3 py-2">Shape</th>
                <th className="text-left px-3 py-2">Menu</th>
                <th className="text-left px-3 py-2">Order</th>
                <th className="text-left px-3 py-2">Active</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIdx.map(({ c, i }) => (
                <tr key={c.id ?? `new-${i}`} className="border-t border-navy/5 hover:bg-cream/50">
                  <td className="px-3 py-2">{c.id && <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id!)} />}</td>
                  <td className="px-3 py-2"><input ref={i === cats.length - 1 ? newNameRef : undefined} value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Category name" className="w-40 bg-cream rounded px-2 py-1 border border-navy/10 outline-none focus:border-gold" /></td>
                  <td className="px-3 py-2"><input value={c.slug} onChange={(e) => update(i, { slug: slugify(e.target.value) })} className="w-32 bg-cream rounded px-2 py-1 border border-navy/10 outline-none focus:border-gold text-xs" /></td>
                  <td className="px-3 py-2">
                    <select value={c.parent_id ?? ""} onChange={(e) => update(i, { parent_id: e.target.value || null })} className="bg-cream rounded px-2 py-1 border border-navy/10 text-xs">
                      <option value="">— top —</option>
                      {parents.filter((p) => p.id !== c.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><div className="w-48"><ImageUploader value={c.image_url ?? ""} onChange={(url) => update(i, { image_url: url })} folder="categories" label="Category image" showUrlField /></div></td>
                  <td className="px-3 py-2">
                    <select value={c.display_shape} onChange={(e) => update(i, { display_shape: e.target.value as any })} className="bg-cream rounded px-2 py-1 border border-navy/10 text-xs">
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" checked={c.is_featured_in_menu} onChange={(e) => update(i, { is_featured_in_menu: e.target.checked })} /></td>
                  <td className="px-3 py-2"><input type="number" value={c.sort_order} onChange={(e) => update(i, { sort_order: Number(e.target.value) })} className="w-14 bg-cream rounded px-2 py-1 border border-navy/10 outline-none" /></td>
                  <td className="px-3 py-2 text-center"><input type="checkbox" checked={c.is_active} onChange={(e) => update(i, { is_active: e.target.checked })} /></td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => save(c, i)} disabled={saving === (c.id ?? "new")} className="text-xs text-gold hover:text-navy px-2"><Save className="w-4 h-4 inline" /></button>
                    <button onClick={() => remove(i, c)} className="text-xs text-error px-2"><Trash2 className="w-4 h-4 inline" /></button>
                  </td>
                </tr>
              ))}
              {filteredIdx.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-neutral-400">No categories match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
