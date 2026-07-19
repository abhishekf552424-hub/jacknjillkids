"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
import { slugify } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";

type C = { id: string; name: string; parent_id: string | null };
type A = { id: string; label: string };
type Coupon = { id: string; code: string; type: string; value: number };
type PickProduct = { id: string; name: string; slug: string; base_price: number };

type Variant = { size: string; color: string; color_hex: string; sku: string; stock_qty: number; price_override: string };
type Bundle = { child_product_id: string; child_variant_id: string; quantity: number };

type ProductProps = {
  categories: C[];
  ageGroups: A[];
  product: any;
  images: any[];
  variants: any[];
  productAges: string[];
  coupons?: Coupon[];
  otherProducts?: PickProduct[];
  bundles?: any[];
};

const TABS = ["Basic", "Pricing", "Variants", "Images", "Combo", "Coupons", "SEO"] as const;
type Tab = typeof TABS[number];

export default function ProductForm({ categories, ageGroups, product, images, variants, productAges, coupons = [], otherProducts = [], bundles = [] }: ProductProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Basic");
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
    product_type: product?.product_type ?? "simple",
    hsn_code: product?.hsn_code ?? "",
    eligible_coupon_codes: (product?.eligible_coupon_codes as string[] | undefined) ?? [],
  });

  const [imgs, setImgs] = useState<{ url: string; alt_text: string }[]>(
    images.length ? images.map((i) => ({ url: i.url, alt_text: i.alt_text ?? "" })) : [],
  );
  const [vars, setVars] = useState<Variant[]>(
    variants.length
      ? variants.map((v) => ({ size: v.size ?? "", color: v.color ?? "", color_hex: v.color_hex ?? "", sku: v.sku ?? "", stock_qty: v.stock_qty ?? 0, price_override: v.price_override ?? "" }))
      : [],
  );
  const [ages, setAges] = useState<string[]>(productAges);
  const [bnd, setBnd] = useState<Bundle[]>(
    bundles.length ? bundles.map((b) => ({ child_product_id: b.child_product_id, child_variant_id: b.child_variant_id ?? "", quantity: b.quantity ?? 1 })) : [],
  );

  // matrix builder
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const sizes = useMemo(() => Array.from(new Set(vars.map((v) => v.size).filter(Boolean))), [vars]);
  const colors = useMemo(() => {
    const m = new Map<string, string>();
    vars.forEach((v) => { if (v.color) m.set(v.color, v.color_hex || ""); });
    return Array.from(m.entries()).map(([color, color_hex]) => ({ color, color_hex }));
  }, [vars]);

  const addSize = () => {
    if (!newSize.trim()) return;
    const s = newSize.trim();
    if (sizes.includes(s)) return setNewSize("");
    // if no colors yet, add plain size row; else create rows for each color
    if (colors.length === 0) setVars([...vars, { size: s, color: "", color_hex: "", sku: "", stock_qty: 10, price_override: "" }]);
    else setVars([...vars, ...colors.map((c) => ({ size: s, color: c.color, color_hex: c.color_hex, sku: "", stock_qty: 10, price_override: "" }))]);
    setNewSize("");
  };
  const addColor = () => {
    if (!newColor.trim()) return;
    const c = newColor.trim();
    if (colors.some((x) => x.color === c)) return setNewColor("");
    if (sizes.length === 0) setVars([...vars, { size: "", color: c, color_hex: "", sku: "", stock_qty: 10, price_override: "" }]);
    else setVars([...vars, ...sizes.map((s) => ({ size: s, color: c, color_hex: "", sku: "", stock_qty: 10, price_override: "" }))]);
    setNewColor("");
  };
  const removeSize = (s: string) => setVars(vars.filter((v) => v.size !== s));
  const removeColor = (c: string) => setVars(vars.filter((v) => v.color !== c));
  const bulkStock = (n: number) => setVars(vars.map((v) => ({ ...v, stock_qty: n })));

  const save = async () => {
    if (!p.name || !p.base_price || !p.mrp) return toast.error("Name, price and MRP are required");
    setSaving(true);
    const slug = p.slug || slugify(p.name);
    const r = await fetch(`/api/admin/products${product ? `/${product.id}` : ""}`, {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: { ...p, slug },
        images: imgs.filter((i) => i.url),
        variants: vars,
        age_group_ids: ages,
        bundles: bnd,
      }),
    });
    setSaving(false);
    const j = await r.json();
    if (!r.ok || !j.ok) return toast.error(j.error || "Save failed");
    toast.success("Saved");
    router.push("/admin/products");
    router.refresh();
  };

  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = otherProducts.filter((x) => x.id !== product?.id && (!productSearch || x.name.toLowerCase().includes(productSearch.toLowerCase()))).slice(0, 30);

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Catalogue</p>
          <h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">{product ? "Edit product" : "New product"}</h1>
        </div>
        <button disabled={saving} onClick={save} data-testid="save-product-btn" className="bg-navy text-white rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm disabled:opacity-60">
          {saving ? "Saving..." : product ? "Save changes" : "Create"}
        </button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-neutral-200 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 text-sm px-3 py-2 -mb-px border-b-2 transition-colors ${tab === t ? "border-gold text-navy font-medium" : "border-transparent text-neutral-500 hover:text-navy"}`}>{t}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-soft space-y-4">
          {tab === "Basic" && (
            <>
              <Field label="Name" value={p.name} onChange={(v) => setP({ ...p, name: v })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Slug (URL)" value={p.slug} onChange={(v) => setP({ ...p, slug: slugify(v) })} placeholder="auto from name" />
                <Field label="Brand" value={p.brand} onChange={(v) => setP({ ...p, brand: v })} />
              </div>
              <Field label="Short description (list card)" value={p.short_description} onChange={(v) => setP({ ...p, short_description: v })} />
              <Textarea label="Long description" value={p.description} onChange={(v) => setP({ ...p, description: v })} rows={6} />
              <div className="grid sm:grid-cols-3 gap-3">
                <Select label="Gender" value={p.gender} onChange={(v) => setP({ ...p, gender: v })} options={[["boys","Boys"],["girls","Girls"],["unisex","Unisex"]]} />
                <Select label="Product type" value={p.product_type} onChange={(v) => setP({ ...p, product_type: v })} options={[["simple","Simple product"],["combo","Combo / bundle"]]} />
                <Select label="Category" value={p.category_id} onChange={(v) => setP({ ...p, category_id: v })} options={categories.map((c) => [c.id, c.name] as [string, string])} />
              </div>
            </>
          )}

          {tab === "Pricing" && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Selling price ₹" type="number" value={String(p.base_price)} onChange={(v) => setP({ ...p, base_price: v })} />
                <Field label="MRP (before discount) ₹" type="number" value={String(p.mrp)} onChange={(v) => setP({ ...p, mrp: v })} />
              </div>
              <Field label="HSN code (for GST invoice)" value={p.hsn_code} onChange={(v) => setP({ ...p, hsn_code: v })} placeholder="e.g. 6111" />
              {p.mrp && p.base_price && Number(p.mrp) > Number(p.base_price) && (
                <p className="text-xs text-green-600">Customer saves ₹{Number(p.mrp) - Number(p.base_price)} ({Math.round(((Number(p.mrp) - Number(p.base_price)) / Number(p.mrp)) * 100)}% off)</p>
              )}
            </>
          )}

          {tab === "Variants" && (
            <div className="space-y-4">
              {p.product_type === "combo" ? (
                <p className="text-sm text-neutral-500">Combo products don't have their own variants \u2014 they inherit stock from the child products in the <b>Combo</b> tab.</p>
              ) : (
                <>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Sizes</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {sizes.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 bg-cream text-navy rounded-full px-3 py-1 text-xs border border-gold/30">{s}<button onClick={() => removeSize(s)}><Trash2 className="w-3 h-3 text-error" /></button></span>
                      ))}
                      <input value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }} placeholder="Add size (e.g. 4-5Y)" className="text-xs bg-white border border-neutral-200 rounded-full px-3 py-1 outline-none focus:border-gold w-32" />
                      <button onClick={addSize} className="text-xs text-gold font-medium">Add</button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Colors</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {colors.map((c) => (
                        <span key={c.color} className="inline-flex items-center gap-1 bg-cream text-navy rounded-full px-3 py-1 text-xs border border-gold/30">
                          {c.color_hex && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.color_hex }} />}
                          {c.color}<button onClick={() => removeColor(c.color)}><Trash2 className="w-3 h-3 text-error" /></button>
                        </span>
                      ))}
                      <input value={newColor} onChange={(e) => setNewColor(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }} placeholder="Add color (e.g. Navy)" className="text-xs bg-white border border-neutral-200 rounded-full px-3 py-1 outline-none focus:border-gold w-32" />
                      <button onClick={addColor} className="text-xs text-gold font-medium">Add</button>
                    </div>
                  </div>

                  {vars.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs uppercase tracking-widest text-navy font-bold">Matrix ({vars.length} combinations)</div>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Bulk stock" onKeyDown={(e) => { if (e.key === "Enter") { const v = Number((e.target as HTMLInputElement).value); if (!isNaN(v)) bulkStock(v); } }} className="text-xs border rounded px-2 py-1 w-24" />
                          <span className="text-[10px] text-neutral-400">Enter \u2192 apply to all</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                              <th className="text-left px-2 py-2">Size</th>
                              <th className="text-left px-2 py-2">Color</th>
                              <th className="text-left px-2 py-2">Hex</th>
                              <th className="text-left px-2 py-2">SKU</th>
                              <th className="text-left px-2 py-2">Stock</th>
                              <th className="text-left px-2 py-2">Price override</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {vars.map((v, i) => (
                              <tr key={i} className="border-t border-neutral-100">
                                <td className="px-2 py-1"><input value={v.size} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, size: e.target.value } : y))} className="w-16 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><input value={v.color} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, color: e.target.value } : y))} className="w-20 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><input value={v.color_hex} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, color_hex: e.target.value } : y))} placeholder="#..." className="w-20 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><input value={v.sku} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, sku: e.target.value } : y))} className="w-28 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><input type="number" value={v.stock_qty} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, stock_qty: Number(e.target.value) } : y))} className="w-16 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><input type="number" value={v.price_override} onChange={(e) => setVars(vars.map((y, j) => j === i ? { ...y, price_override: e.target.value } : y))} placeholder="\u2014" className="w-24 border rounded px-2 py-1" /></td>
                                <td className="px-2 py-1"><button onClick={() => setVars(vars.filter((_, j) => j !== i))} className="text-error p-1"><Trash2 className="w-3.5 h-3.5" /></button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "Images" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imgs.map((im, i) => (
                  <div key={i} className="space-y-1">
                    <ImageUploader value={im.url} folder="products" onChange={(url) => setImgs(imgs.map((x, j) => j === i ? { ...x, url } : x))} />
                    <input value={im.alt_text} onChange={(e) => setImgs(imgs.map((x, j) => j === i ? { ...x, alt_text: e.target.value } : x))} placeholder="alt text" className="w-full text-xs border rounded px-2 py-1" />
                  </div>
                ))}
                <button onClick={() => setImgs([...imgs, { url: "", alt_text: "" }])} className="border-2 border-dashed border-neutral-300 rounded-lg aspect-video flex flex-col items-center justify-center gap-1 text-neutral-400 hover:border-gold hover:text-navy text-xs">
                  <Plus className="w-5 h-5" /> Add image
                </button>
              </div>
            </div>
          )}

          {tab === "Combo" && (
            p.product_type !== "combo" ? (
              <p className="text-sm text-neutral-500">Set <b>Product type</b> to \"Combo / bundle\" on the Basic tab to compose this from other products.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-neutral-50 border rounded px-2 py-1.5">
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products to add\u2026" className="flex-1 bg-transparent text-sm outline-none" />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded">
                  {filteredProducts.map((op) => (
                    <button key={op.id} onClick={() => setBnd([...bnd, { child_product_id: op.id, child_variant_id: "", quantity: 1 }])} className="w-full text-left px-3 py-2 text-xs hover:bg-cream/50 border-b border-neutral-100 flex justify-between">
                      <span>{op.name}</span><span className="text-neutral-400">\u20b9{op.base_price}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Items in this combo</div>
                  {bnd.length === 0 && <p className="text-xs text-neutral-400">No items yet.</p>}
                  {bnd.map((b, i) => {
                    const child = otherProducts.find((x) => x.id === b.child_product_id);
                    return (
                      <div key={i} className="flex items-center gap-2 border rounded px-2 py-2 mb-2 text-sm">
                        <span className="flex-1">{child?.name || "\u2014"}</span>
                        <label className="text-xs flex items-center gap-1">Qty <input type="number" value={b.quantity} onChange={(e) => setBnd(bnd.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))} className="w-14 border rounded px-2 py-1" /></label>
                        <button onClick={() => setBnd(bnd.filter((_, j) => j !== i))} className="text-error p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {tab === "Coupons" && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500">Highlight coupons that apply to this product. Selected codes show on the product page with one-click apply.</p>
              {coupons.length === 0 ? <p className="text-xs text-neutral-400">No active coupons yet. Create one in <a className="underline" href="/admin/coupons">Coupons</a>.</p> : coupons.map((c) => (
                <label key={c.id} className="flex items-center gap-3 bg-cream/40 rounded px-3 py-2 border border-neutral-200 cursor-pointer">
                  <input type="checkbox" checked={p.eligible_coupon_codes.includes(c.code)} onChange={(e) => setP({ ...p, eligible_coupon_codes: e.target.checked ? [...p.eligible_coupon_codes, c.code] : p.eligible_coupon_codes.filter((x) => x !== c.code) })} />
                  <span className="font-mono text-xs bg-navy text-white rounded px-2 py-0.5">{c.code}</span>
                  <span className="text-sm text-navy">{c.type === "percent" ? `${c.value}% off` : `\u20b9${c.value} off`}</span>
                </label>
              ))}
            </div>
          )}

          {tab === "SEO" && (
            <div className="space-y-3">
              <Field label="Meta title" value={p.meta_title} onChange={(v) => setP({ ...p, meta_title: v })} />
              <Textarea label="Meta description" value={p.meta_description} onChange={(v) => setP({ ...p, meta_description: v })} rows={3} />
              <Field label="Default image alt text" value={p.alt_text} onChange={(v) => setP({ ...p, alt_text: v })} />
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">Publish</p>
            <Select label="Status" value={p.status} onChange={(v) => setP({ ...p, status: v })} options={[["active","Active"],["draft","Draft"],["out_of_stock","Out of stock"],["archived","Archived"]]} />
            <label className="flex items-center gap-2 text-sm text-navy mt-3"><input type="checkbox" checked={p.is_featured} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Most Loved shelf</label>
            <label className="flex items-center gap-2 text-sm text-navy mt-2"><input type="checkbox" checked={p.is_new_arrival} onChange={(e) => setP({ ...p, is_new_arrival: e.target.checked })} /> New Arrival shelf</label>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">Age groups</p>
            <div className="flex flex-wrap gap-1.5">
              {ageGroups.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAges(ages.includes(a.id) ? ages.filter((x) => x !== a.id) : [...ages, a.id])}
                  className={`text-xs px-2.5 py-1 rounded-full border ${ages.includes(a.id) ? "bg-navy text-white border-navy" : "bg-white text-navy border-navy/10"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button disabled={saving} onClick={save} className="w-full bg-brand-gradient text-white rounded-lg py-3 font-bold shadow-premium disabled:opacity-60">
            {saving ? "Saving..." : product ? "Save changes" : "Create product"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Field(props: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      {props.label && <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>}
      <input type={props.type || "text"} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="mt-1 w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}
function Textarea(props: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>
      <textarea rows={props.rows ?? 3} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="mt-1 w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm outline-none focus:border-gold" />
    </label>
  );
}
function Select(props: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-navy font-bold">{props.label}</span>
      <select value={props.value} onChange={(e) => props.onChange(e.target.value)} className="mt-1 w-full bg-white border border-neutral-200 rounded px-3 py-2 text-sm outline-none focus:border-gold">
        {props.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
