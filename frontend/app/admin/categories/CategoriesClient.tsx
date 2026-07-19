"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { slugify } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";

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

  const update = (i: number, patch: Partial<C>) => setCats(cats.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const save = async (c: C) => {
    setSaving(c.id ?? "new");
    const r = await fetch("/api/admin/categories" + (c.id ? `/${c.id}` : ""), {
      method: c.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, slug: c.slug || slugify(c.name) }),
    });
    setSaving(null);
    if (!r.ok) {
      const j = await r.json();
      return toast.error(j.error || "Save failed");
    }
    const j = await r.json();
    toast.success("Saved");
    if (!c.id && j.id) setCats(cats.map((x) => (x === c ? { ...c, id: j.id } : x)));
  };

  const remove = async (i: number, c: C) => {
    if (!c.id) return setCats(cats.filter((_, j) => j !== i));
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
    setCats(cats.filter((_, j) => j !== i));
    toast.success("Deleted");
  };

  const parents = cats.filter((c) => !c.parent_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Taxonomy</p>
          <h1 className="font-display text-3xl text-navy tracking-tight">Categories</h1>
        </div>
        <button onClick={() => setCats([...cats, { parent_id: null, name: "", slug: "", image_url: "", display_shape: "circle", is_featured_in_menu: false, sort_order: cats.length + 1, is_active: true } as C])} className="bg-navy text-white rounded px-4 py-2.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </div>

      <div className="bg-white rounded-lg shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream text-navy">
            <tr>
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
            {cats.map((c, i) => (
              <tr key={c.id ?? `new-${i}`} className="border-t border-navy/5">
                <td className="px-3 py-2"><input value={c.name} onChange={(e) => update(i, { name: e.target.value })} className="w-40 bg-cream rounded px-2 py-1 border border-navy/10 outline-none focus:border-gold" /></td>
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
                  <button onClick={() => save(c)} disabled={saving === (c.id ?? "new")} className="text-xs text-gold hover:text-navy px-2"><Save className="w-4 h-4 inline" /></button>
                  <button onClick={() => remove(i, c)} className="text-xs text-error px-2"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
