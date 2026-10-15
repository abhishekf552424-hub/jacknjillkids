"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Search, GripVertical, Star, Loader2 } from "lucide-react";
import { slugify } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";
import { compressImage } from "@/lib/image-compress";
import CategoryPicker from "@/components/admin/CategoryPicker";
import { variantPriceProblem } from "@/lib/product-variants";
import { formatINR } from "@/lib/utils";

type C = { id: string; name: string; parent_id: string | null; sort_order?: number | null; is_active?: boolean };
type A = { id: string; label: string };
type Coupon = { id: string; code: string; type: string; value: number };
type PickProduct = { id: string; name: string; slug: string; base_price: number };

type Variant = { id?: string; size: string; color: string; color_hex: string; sku: string; stock_qty: number; price_override: string; mrp_override: string };
const newVar = (v: Partial<Variant>): Variant => ({ size: "", color: "", color_hex: "", sku: "", stock_qty: 10, price_override: "", mrp_override: "", ...v });
const str = (v: unknown) => (v == null ? "" : String(v));
type Bundle = { child_product_id: string; child_variant_id: string; quantity: number };

type ProductProps = {
  categories: C[];
  ageGroups: A[];
  product: any;
  images: any[];
  variants: any[];
  productAges: string[];
  productCategories?: string[];
  coupons?: Coupon[];
  otherProducts?: PickProduct[];
  bundles?: any[];
};

const TABS = ["Basic", "Pricing", "Variants", "Images", "Combo", "Coupons", "SEO"] as const;
type Tab = typeof TABS[number];

export default function ProductForm({ categories, ageGroups, product, images, variants, productAges, productCategories = [], coupons = [], otherProducts = [], bundles = [] }: ProductProps) {
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
    size_chart_url: product?.size_chart_url ?? "",
    eligible_coupon_codes: (product?.eligible_coupon_codes as string[] | undefined) ?? [],
  });

  const [imgs, setImgs] = useState<{ url: string; alt_text: string }[]>(
    images.length ? images.map((i) => ({ url: i.url, alt_text: i.alt_text ?? "" })) : [],
  );
  const [bulkUploading, setBulkUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Mirrors ImageUploader's own upload path (compress → signed URL → XHR PUT)
  // so bulk-selected files go through the exact same compression + storage
  // route as a single upload, just looped per file.
  const uploadOneFile = async (file: File): Promise<string> => {
    const compressed = await compressImage(file);
    const res = await fetch("/api/admin/uploads/signed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: compressed.name, folder: "products", contentType: compressed.type }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Signed URL failed");
    const { signedUrl, publicUrl } = await res.json();
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", signedUrl, true);
      xhr.setRequestHeader("Content-Type", compressed.type || "application/octet-stream");
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed " + xhr.status)));
      xhr.onerror = () => reject(new Error("Upload error"));
      xhr.send(compressed);
    });
    return publicUrl;
  };

  const bulkUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBulkUploading(true);
    let okCount = 0;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadOneFile(file);
        setImgs((prev) => [...prev, { url, alt_text: "" }]);
        okCount++;
      } catch (e: any) {
        toast.error(`"${file.name}" failed to upload — ${e.message || "unknown error"}`);
      }
    }
    setBulkUploading(false);
    if (okCount) toast.success(`Uploaded ${okCount} image${okCount > 1 ? "s" : ""}`);
  };

  const reorderImgs = (from: number, to: number) => {
    if (from === to) return;
    setImgs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const makeCover = (i: number) => reorderImgs(i, 0);
  const [vars, setVars] = useState<Variant[]>(
    variants.length
      ? variants.map((v) => ({ id: v.id, size: v.size ?? "", color: v.color ?? "", color_hex: v.color_hex ?? "", sku: v.sku ?? "", stock_qty: v.stock_qty ?? 0, price_override: str(v.price_override), mrp_override: str(v.mrp_override) }))
      : [],
  );
  const [ages, setAges] = useState<string[]>(productAges);
  const [catIds, setCatIds] = useState<string[]>(productCategories.length ? productCategories : (product?.category_id ? [product.category_id] : []));
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
    if (colors.length === 0) setVars([...vars, newVar({ size: s })]);
    else setVars([...vars, ...colors.map((c) => newVar({ size: s, color: c.color, color_hex: c.color_hex }))]);
    setNewSize("");
  };
  const addColor = () => {
    if (!newColor.trim()) return;
    const c = newColor.trim();
    if (colors.some((x) => x.color === c)) return setNewColor("");
    // Copy each size's own price to the new colour, so "different price per size" stays filled in.
    const priceOf = (s: string) => vars.find((v) => v.size === s) ?? newVar({});
    if (sizes.length === 0) setVars([...vars, newVar({ color: c })]);
    else setVars([...vars, ...sizes.map((s) => newVar({ size: s, color: c, price_override: priceOf(s).price_override, mrp_override: priceOf(s).mrp_override }))]);
    setNewColor("");
  };
  const removeSize = (s: string) => setVars(vars.filter((v) => v.size !== s));
  const removeColor = (c: string) => setVars(vars.filter((v) => v.color !== c));
  const bulkStock = (n: number) => setVars(vars.map((v) => ({ ...v, stock_qty: n })));

  // ---- price per size ----
  const [perSizePrice, setPerSizePrice] = useState(() => vars.some((v) => v.price_override !== "" || v.mrp_override !== ""));
  // Price groups: by size when there are sizes, else by colour.
  const groupOf = (v: Variant) => (sizes.length ? v.size : v.color) || "One size";
  const groups = useMemo(() => Array.from(new Set(vars.map(groupOf))), [vars, sizes.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const groupValue = (g: string, k: "price_override" | "mrp_override") => {
    const vals = Array.from(new Set(vars.filter((v) => groupOf(v) === g).map((v) => v[k])));
    return vals.length === 1 ? vals[0] : "";
  };
  const setGroup = (g: string, k: "price_override" | "mrp_override", val: string) =>
    setVars(vars.map((v) => (groupOf(v) === g ? { ...v, [k]: val } : v)));
  const setVar = (i: number, patch: Partial<Variant>) => setVars(vars.map((y, j) => (j === i ? { ...y, ...patch } : y)));
  const usePerSize = (on: boolean) => {
    if (!on && vars.some((v) => v.price_override !== "" || v.mrp_override !== "")) {
      if (!confirm("Use the same price for every size? The separate size prices will be cleared.")) return;
      setVars(vars.map((v) => ({ ...v, price_override: "", mrp_override: "" })));
    }
    setPerSizePrice(on);
  };
  const effPrice = (v: Variant) => Number(v.price_override !== "" ? v.price_override : p.base_price) || 0;
  const effMrp = (v: Variant) => Math.max(Number(v.mrp_override !== "" ? v.mrp_override : p.mrp) || 0, effPrice(v));
  const priceRange = useMemo(() => {
    const ps = vars.map(effPrice).filter((n) => n > 0);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
  }, [vars, p.base_price]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!p.name || !p.base_price || !p.mrp) return toast.error("Name, price and MRP are required");
    if (catIds.length === 0) return toast.error("Please select at least one category.");
    if (p.product_type === "simple" && vars.length === 0) {
      return toast.error("Please set stock for this product in the Variants tab before saving — a product with no stock can't be ordered.");
    }
    const vp = p.product_type === "simple" ? variantPriceProblem(p, vars) : null;
    if (vp) { setTab("Variants"); return toast.error(vp); }
    setSaving(true);
    const slug = p.slug || slugify(p.name);
    const r = await fetch(`/api/admin/products${product ? `/${product.id}` : ""}`, {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: { ...p, slug, category_id: catIds[0] ?? null },
        images: imgs.filter((i) => i.url),
        variants: vars,
        age_group_ids: ages,
        category_ids: catIds,
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
          <p className="text-xs uppercase tracking-widest text-gold-text font-bold">Catalogue</p>
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
              <div className="grid sm:grid-cols-2 gap-3">
                <Select label="Gender" value={p.gender} onChange={(v) => setP({ ...p, gender: v })} options={[["boys","Boys"],["girls","Girls"],["unisex","Unisex"]]} />
                {/* Combo selling isn't wired into the shop/checkout yet, so only existing combos can keep that type. */}
                <Select label="Product type" value={p.product_type} onChange={(v) => setP({ ...p, product_type: v })} options={p.product_type === "combo" ? [["simple","Simple product"],["combo","Combo / bundle"]] : [["simple","Simple product"]]} />
              </div>
            </>
          )}

          {tab === "Pricing" && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Selling price ₹" type="number" value={String(p.base_price)} onChange={(v) => setP({ ...p, base_price: v })} />
                <Field label="MRP (before discount) ₹" type="number" value={String(p.mrp)} onChange={(v) => setP({ ...p, mrp: v })} />
              </div>
              <p className="text-xs text-neutral-500 -mt-1">This is the default price for every size. If some sizes cost more or less, set their own price in the <button type="button" onClick={() => setTab("Variants")} className="underline text-navy font-medium">Variants</button> tab.</p>
              {priceRange && priceRange.max > priceRange.min && (
                <p className="text-xs text-navy bg-cream rounded px-3 py-2">Sizes are priced from <b>{formatINR(priceRange.min)}</b> to <b>{formatINR(priceRange.max)}</b> — the shop shows “From {formatINR(priceRange.min)}”.</p>
              )}
              <Field label="HSN code (for GST invoice)" value={p.hsn_code} onChange={(v) => setP({ ...p, hsn_code: v })} placeholder="e.g. 6111" />
              <Field label="Size chart link (optional)" value={p.size_chart_url} onChange={(v) => setP({ ...p, size_chart_url: v })} placeholder="https://… (image or PDF of the size chart)" />
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
                  {vars.length === 0 && (
                    <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                      <p className="text-sm text-navy font-medium mb-2">No sizes/colors set yet — quick stock entry</p>
                      <p className="text-xs text-neutral-500 mb-3">If this product doesn't need size/color variants, just set a stock quantity here — a single "One Size" variant will be created automatically. You can still add sizes/colors below at any time instead.</p>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-neutral-500">Stock quantity</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 50"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const n = Number((e.target as HTMLInputElement).value);
                              if (!isNaN(n)) setVars([newVar({ size: "One Size", stock_qty: n })]);
                            }
                          }}
                          onBlur={(e) => {
                            const n = Number(e.target.value);
                            if (!isNaN(n) && e.target.value !== "") setVars([newVar({ size: "One Size", stock_qty: n })]);
                          }}
                          className="w-28 border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Sizes</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {sizes.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 bg-cream text-navy rounded-full px-3 py-1 text-xs border border-gold/30">{s}<button onClick={() => removeSize(s)}><Trash2 className="w-3 h-3 text-error" /></button></span>
                      ))}
                      <input value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }} placeholder="Add size (e.g. 4-5Y)" className="text-xs bg-white border border-neutral-200 rounded-full px-3 py-1 outline-none focus:border-gold w-32" />
                      <button onClick={addSize} className="text-xs text-gold-text font-medium">Add</button>
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
                      <button onClick={addColor} className="text-xs text-gold-text font-medium">Add</button>
                    </div>
                  </div>

                  {vars.length > 0 && (
                    <div className="rounded-lg border border-gold/40 bg-cream/40 p-3 sm:p-4" data-testid="variant-pricing">
                      <div className="text-xs uppercase tracking-widest text-navy font-bold mb-2">Price for each size</div>
                      <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Price for each size">
                        <button type="button" role="radio" aria-checked={!perSizePrice} onClick={() => usePerSize(false)} className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${!perSizePrice ? "border-navy bg-white ring-2 ring-navy/10" : "border-neutral-200 bg-white/60 hover:border-navy/40"}`}>
                          <span className="block font-semibold text-navy">Same price for all sizes</span>
                          <span className="block text-xs text-neutral-500 mt-0.5">{p.base_price ? `${formatINR(Number(p.base_price))}${Number(p.mrp) > Number(p.base_price) ? ` · MRP ${formatINR(Number(p.mrp))}` : ""} (from the Pricing tab)` : "Set it in the Pricing tab"}</span>
                        </button>
                        <button type="button" role="radio" aria-checked={perSizePrice} data-testid="per-size-price" onClick={() => usePerSize(true)} className={`text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${perSizePrice ? "border-navy bg-white ring-2 ring-navy/10" : "border-neutral-200 bg-white/60 hover:border-navy/40"}`}>
                          <span className="block font-semibold text-navy">Different price per {sizes.length ? "size" : "colour"}</span>
                          <span className="block text-xs text-neutral-500 mt-0.5">e.g. 0-6M ₹499, 2-3Y ₹699</span>
                        </button>
                      </div>

                      {perSizePrice && (
                        <div className="mt-3">
                          <p className="text-xs text-neutral-500 mb-2">Leave a box empty to use the product price / MRP. {colors.length > 0 && sizes.length > 0 ? "A size's price applies to all its colours (change single rows in the table below)." : ""}</p>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {groups.map((g) => {
                              const pr = groupValue(g, "price_override");
                              const mr = groupValue(g, "mrp_override");
                              const sample = vars.find((v) => groupOf(v) === g)!;
                              const off = effMrp(sample) > effPrice(sample) ? Math.round(((effMrp(sample) - effPrice(sample)) / effMrp(sample)) * 100) : 0;
                              const bad = (Number(mr || p.mrp) > 0) && effPrice(sample) > Number(mr || p.mrp);
                              return (
                                <div key={g} className={`rounded-lg bg-white border px-3 py-2 ${bad ? "border-error" : "border-neutral-200"}`} data-testid={`size-price-${g}`}>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-bold text-navy">{g}</span>
                                    {off > 0 && <span className="text-[10px] font-bold text-success">{off}% off</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <label className="block">
                                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Price ₹</span>
                                      <input type="number" min={0} inputMode="decimal" value={pr} onChange={(e) => setGroup(g, "price_override", e.target.value)} placeholder={String(p.base_price || "")} className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm" />
                                    </label>
                                    <label className="block">
                                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">MRP ₹</span>
                                      <input type="number" min={0} inputMode="decimal" value={mr} onChange={(e) => setGroup(g, "mrp_override", e.target.value)} placeholder={String(p.mrp || "")} className="mt-0.5 w-full border rounded px-2 py-1.5 text-sm" />
                                    </label>
                                  </div>
                                  {bad && <p className="mt-1 text-[11px] text-error">Price is above the MRP — add a higher MRP for this {sizes.length ? "size" : "colour"}.</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {vars.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <div className="text-xs uppercase tracking-widest text-navy font-bold">All combinations ({vars.length})</div>
                        <div className="flex items-center gap-2">
                          <input type="number" placeholder="Stock for all" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = Number((e.target as HTMLInputElement).value); if (!isNaN(v)) bulkStock(v); } }} className="text-xs border rounded px-2 py-1 w-28" />
                          <span className="text-[10px] text-neutral-400">Enter → apply to all</span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-widest text-[10px]">
                            <tr>
                              <th className="text-left px-2 py-2">Size</th>
                              <th className="text-left px-2 py-2">Colour</th>
                              <th className="text-left px-2 py-2">Swatch</th>
                              <th className="text-left px-2 py-2">SKU</th>
                              <th className="text-left px-2 py-2">Stock</th>
                              {perSizePrice && <th className="text-left px-2 py-2">Price ₹</th>}
                              {perSizePrice && <th className="text-left px-2 py-2">MRP ₹</th>}
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {vars.map((v, i) => (
                              <tr key={v.id ?? i} className="border-t border-neutral-100">
                                <td className="px-2 py-1"><input value={v.size} onChange={(e) => setVar(i, { size: e.target.value })} className="w-20 border rounded px-2 py-1" aria-label="Size" /></td>
                                <td className="px-2 py-1"><input value={v.color} onChange={(e) => setVar(i, { color: e.target.value })} className="w-20 border rounded px-2 py-1" aria-label="Colour" /></td>
                                <td className="px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(v.color_hex) ? v.color_hex : "#ffffff"} onChange={(e) => setVar(i, { color_hex: e.target.value })} className="w-7 h-7 rounded border p-0" aria-label="Pick colour" />
                                    <input value={v.color_hex} onChange={(e) => setVar(i, { color_hex: e.target.value })} placeholder="#…" className="w-20 border rounded px-2 py-1" aria-label="Colour code" />
                                  </span>
                                </td>
                                <td className="px-2 py-1"><input value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value })} placeholder="optional" className="w-28 border rounded px-2 py-1" aria-label="SKU" /></td>
                                <td className="px-2 py-1"><input type="number" min={0} value={v.stock_qty} onChange={(e) => setVar(i, { stock_qty: Number(e.target.value) })} className="w-16 border rounded px-2 py-1" aria-label="Stock" /></td>
                                {perSizePrice && <td className="px-2 py-1"><input type="number" min={0} value={v.price_override} onChange={(e) => setVar(i, { price_override: e.target.value })} placeholder={String(p.base_price || "")} className={`w-20 border rounded px-2 py-1 ${effPrice(v) > (Number(v.mrp_override || p.mrp) || Infinity) ? "border-error" : ""}`} aria-label="Price" /></td>}
                                {perSizePrice && <td className="px-2 py-1"><input type="number" min={0} value={v.mrp_override} onChange={(e) => setVar(i, { mrp_override: e.target.value })} placeholder={String(p.mrp || "")} className="w-20 border rounded px-2 py-1" aria-label="MRP" /></td>}
                                <td className="px-2 py-1"><button onClick={() => setVars(vars.filter((_, j) => j !== i))} className="text-error p-1" aria-label="Remove this combination"><Trash2 className="w-3.5 h-3.5" /></button></td>
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500">Drag thumbnails to reorder — the first image is the cover shown on listing cards.</p>
                <label className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1.5 ${bulkUploading ? "opacity-60 pointer-events-none" : "border-gold text-navy hover:bg-gold/10"}`}>
                  {bulkUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {bulkUploading ? "Uploading…" : "Add photos"}
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { bulkUpload(e.target.files); e.target.value = ""; }} />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imgs.map((im, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); if (dragIdx !== null) reorderImgs(dragIdx, i); setDragIdx(null); }}
                    onDragEnd={() => setDragIdx(null)}
                    className={`space-y-1 rounded-lg transition-opacity ${dragIdx === i ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between px-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3 h-3" /> {i === 0 ? "Cover" : `#${i + 1}`}
                      </span>
                      {i !== 0 && im.url && (
                        <button type="button" onClick={() => makeCover(i)} className="flex items-center gap-0.5 text-[10px] text-navy/60 hover:text-gold-text">
                          <Star className="w-3 h-3" /> Make cover
                        </button>
                      )}
                    </div>
                    <ImageUploader value={im.url} folder="products" onChange={(url) => setImgs(imgs.map((x, j) => j === i ? { ...x, url } : x))} />
                    <div className="flex items-center gap-1">
                      <input value={im.alt_text} onChange={(e) => setImgs(imgs.map((x, j) => j === i ? { ...x, alt_text: e.target.value } : x))} placeholder="alt text" className="w-full text-xs border rounded px-2 py-1" />
                      <button type="button" onClick={() => setImgs(imgs.filter((_, j) => j !== i))} className="text-error p-1 shrink-0" aria-label="Remove image"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
            <p className="text-xs uppercase tracking-widest text-gold-text font-bold mb-3">Publish</p>
            <Select label="Status" value={p.status} onChange={(v) => setP({ ...p, status: v })} options={[["active","Active"],["draft","Draft"],["out_of_stock","Out of stock"],["archived","Archived"]]} />
            <label className="flex items-center gap-2 text-sm text-navy mt-3"><input type="checkbox" checked={p.is_featured} onChange={(e) => setP({ ...p, is_featured: e.target.checked })} /> Most Loved shelf</label>
            <label className="flex items-center gap-2 text-sm text-navy mt-2"><input type="checkbox" checked={p.is_new_arrival} onChange={(e) => setP({ ...p, is_new_arrival: e.target.checked })} /> New Arrival shelf</label>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-gold-text font-bold mb-1">Categories</p>
            <p className="text-xs text-neutral-500 mb-3">Tick every category this product belongs to. The starred one is the main category.</p>
            <CategoryPicker categories={categories} value={catIds} onChange={setCatIds} />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-gold-text font-bold mb-3">Age groups</p>
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

          <button disabled={saving} onClick={save} className="w-full bg-action hover:bg-action-hover text-white rounded-lg py-3 font-bold shadow-premium disabled:opacity-60">
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
