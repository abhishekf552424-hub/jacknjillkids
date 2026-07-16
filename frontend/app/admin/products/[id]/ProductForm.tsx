"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, X } from "lucide-react";
import { slugify } from "@/lib/utils";

type C = { id: string; name: string; parent_id: string | null };
type A = { id: string; label: string };

export default function ProductForm({
  categories,
  ageGroups,
  product,
  images,
  variants,
  productAges,
}: {
  categories: C[];
  ageGroups: A[];
  product: any;
  images: any[];
  variants: any[];
  productAges: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    short_description: product?.short_description ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    gender: product?.gender ?? "unisex",
    brand: product?.brand ?? "Jack & Jill",
    base_price: product?.base_price ?? "",
    mrp: product?.mrp ?? "",
    status: product?.status ?? "active",
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? false,
    alt_text: product?.alt_text ?? "",
    meta_title: product?.meta_title ?? "",
    meta_description: product?.meta_description ?? "",
  });
  const [imgs, setImgs] = useState<{ url: string; alt_text: string }[]>(
    images.length ? images.map((i) => ({ url: i.url, alt_text: i.alt_text ?? "" })) : [{ url: "", alt_text: "" }],
  );
  const [vars, setVars] = useState<{ size: string; color: string; color_hex: string; sku: string; stock_qty: number; price_override: string }[]>(
    variants.length
      ? variants.map((v) => ({ size: v.size ?? "", color: v.color ?? "", color_hex: v.color_hex ?? "", sku: v.sku ?? "", stock_qty: v.stock_qty ?? 0, price_override: v.price_override ?? "" }))
      : [{ size: "", color: "", color_hex: "", sku: "", stock_qty: 10, price_override: "" }],
  );
  const [ages, setAges] = useState<string[]>(productAges);

  const save = async () => {
    if (!p.name || !p.base_price || !p.mrp) return toast.error("Name, price and MRP required");
    setSaving(true);
    const slug = p.slug || slugify(p.name);
    const r = await fetch(`/api/admin/products${product ? `/${product.id}` : ""}`, {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product: { ...p, slug }, images: imgs.filter((i) => i.url), variants: vars, age_group_ids: ages }),
    });
    setSaving(false);
    const j = await r.json();
    if (!r.ok || !j.ok) return toast.error(j.error || "Save failed");
    toast.success("Saved");
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Catalogue</p>
      <h1 className="font-display text-3xl text-navy tracking-tight">{product ? "Edit product" : "New product"}</h1>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Basic details">
            <Field label="Name" value={p.name} onChange={(v) => setP({ ...p, name: v })} />
            <Field label="Slug (URL)" value={p.slug} onChange={(v) => setP({ ...p, slug: slugify(v) })} placeholder="auto from name" />
            <Field label="Short description" value={p.short_description} onChange={(v) => setP({ ...p, short_description: v })} />
            <Textarea label="Description" value={p.description} onChange={(v) => setP({ ...p, description: v })} rows={5} />
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Base price (₹)" value={String(p.base_price)} onChange={(v) => setP({ ...p, base_price: v })} type="number" />
              <Field label="MRP (₹)" value={String(p.mrp)} onChange={(v) => setP({ ...p, mrp: v })} type="number" />
              <Select label="Gender" value={p.gender} onChange={(v) => setP({ ...p, gender: v })} options={[["boys","Boys"],["girls","Girls"],["unisex","Unisex"]]} />
            </div>
          </Card>

          <Card title="Images">
            {imgs.map((im, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end mb-2">
                <Field label={i === 0 ? "URL" : ""} value={im.url} onChange={(v) => setImgs(imgs.map((x, j) => j === i ? { ...x, url: v } : x))} placeholder="https://..." />
                <Field label={i === 0 ? "Alt text" : ""} value={im.alt_text} onChange={(v) => setImgs(imgs.map((x, j) => j === i ? { ...x, alt_text: v } : x))} />
                <button onClick={() => setImgs(imgs.filter((_, j) => j !== i))} className="text-error p-2"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setImgs([...imgs, { url: "", alt_text: "" }])} className="text-sm text-gold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add image</button>
          </Card>

          <Card title="Variants (size × color)">
            <div className="space-y-2">
              {vars.map((v, i) => (
                <div key={i} className="grid grid-cols-[repeat(5,1fr)_auto] gap-2 items-end">
                  <Field label={i === 0 ? "Size" : ""} value={v.size} onChange={(x) => setVars(vars.map((y, j) => j === i ? { ...y, size: x } : y))} />
                  <Field label={i === 0 ? "Color" : ""} value={v.color} onChange={(x) => setVars(vars.map((y, j) => j === i ? { ...y, color: x } : y))} />
                  <Field label={i === 0 ? "Hex" : ""} value={v.color_hex} onChange={(x) => setVars(vars.map((y, j) => j === i ? { ...y, color_hex: x } : y))} placeholder="#..." />
                  <Field label={i === 0 ? "SKU" : ""} value={v.sku} onChange={(x) => setVars(vars.map((y, j) => j === i ? { ...y, sku: x } : y))} />
                  <Field label={i === 0 ? "Stock" : ""} type="number" value={String(v.stock_qty)} onChange={(x) => setVars(vars.map((y, j) => j === i ? { ...y, stock_qty: Number(x) } : y))} />
                  <button onClick={() => setVars(vars.filter((_, j) => j !== i))} className="text-error p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => setVars([...vars, { size: "", color: "", color_hex: "", sku: "", stock_qty: 10, price_override: "" }])} className="text-sm text-gold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add variant</button>
            </div>
          </Card>

          <Card title="SEO">
            <Field label="Meta title" value={p.meta_title} onChange={(v) => setP({ ...p, meta_title: v })} />
            <Textarea label="Meta description" value={p.meta_description} onChange={(v) => setP({ ...p, meta_description: v })} rows={3} />
            <Field label="Alt text (default)" value={p.alt_text} onChange={(v) => setP({ ...p, alt_text: v })} />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Publish">
            <Select label="Status" value={p.status} onChange={(v) => setP({ ...p, status: v })} options={[["active","Active"],["draft","Draft"],["out_of_stock","Out of stock"],["archived","Archived"]]} />
            <label className="flex items-center gap-2 text-sm text-navy mt-3"><input type="checkbox" checked={p.is_featured} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Feature in "Most Loved"</label>
            <label className="flex items-center gap-2 text-sm text-navy mt-2"><input type="checkbox" checked={p.is_new_arrival} onChange={(e) => setP({ ...p, is_new_arrival: e.target.checked })} /> Show as "New Arrival"</label>
          </Card>

          <Card title="Category">
            <Select label="Category" value={p.category_id} onChange={(v) => setP({ ...p, category_id: v })} options={categories.map((c) => [c.id, c.name] as [string, string])} />
          </Card>

          <Card title="Age groups">
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAges(ages.includes(a.id) ? ages.filter((x) => x !== a.id) : [...ages, a.id])}
                  className={`text-xs px-3 py-1.5 rounded-full border ${ages.includes(a.id) ? "bg-navy text-white border-navy" : "bg-white text-navy border-navy/10"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Card>

          <button disabled={saving} onClick={save} data-testid="save-product-btn" className="w-full bg-brand-gradient text-white rounded py-3 font-bold shadow-premium disabled:opacity-60">
            {saving ? "Saving..." : product ? "Save changes" : "Create product"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-soft">
      <p className="text-xs uppercase tracking-widest text-gold font-bold mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Field(props: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      {props.label && <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>}
      <input type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}
function Textarea(props: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>
      <textarea rows={props.rows ?? 3} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}
function Select(props: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)} className="mt-1 w-full bg-cream border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold">
        {props.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
