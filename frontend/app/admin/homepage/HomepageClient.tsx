"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Save, Eye, EyeOff, Plus, Trash2, Sparkles, Video, Image as ImageIcon, Search } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";

type Section = {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  config: any;
  sort_order: number;
  is_active: boolean;
};

type PickProduct = { id: string; name: string; slug: string };

export default function HomepageClient({ initial, products, promo }: { initial: Section[]; products: PickProduct[]; promo: any }) {
  const [rows, setRows] = useState<Section[]>(initial);
  const [popup, setPopup] = useState<any>(promo || { enabled: false, image_url: "", link: "", headline: "", subtext: "", frequency: "session", delay_seconds: 3, start_date: "", end_date: "" });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= rows.length) return;
    const arr = [...rows];[arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((r, k) => (r.sort_order = k + 1));
    setRows(arr);
  };
  const update = (id: string, patch: Partial<Section>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const save = async (r: Section) => {
    const res = await fetch(`/api/admin/homepage/${r.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: r.title, subtitle: r.subtitle, config: r.config, is_active: r.is_active, sort_order: r.sort_order }) });
    if (!res.ok) return toast.error("Save failed");
    toast.success("Saved");
  };
  const saveAllOrder = async () => { await Promise.all(rows.map(save)); toast.success("Order saved"); };
  const savePopup = async () => {
    const r = await fetch("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: "promo_popup", value: popup }) });
    if (!r.ok) return toast.error("Failed"); toast.success("Popup saved");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><p className="text-xs uppercase tracking-widest text-gold font-bold">Homepage</p><h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">Sections</h1></div>
        <button onClick={saveAllOrder} className="bg-navy text-white rounded-lg px-4 py-2 text-sm">Save order</button>
      </div>

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id} className="bg-white rounded-lg p-4 md:p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5"><button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button><button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button></div>
              <div className="flex-1"><p className="text-[10px] uppercase tracking-widest text-gold font-bold">{r.section_type.replace(/_/g, " ")}</p></div>
              <button onClick={() => { update(r.id, { is_active: !r.is_active }); }} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 ${r.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>{r.is_active ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}</button>
              <button onClick={() => save(r)} className="bg-navy text-white rounded px-3 py-1.5 text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input value={r.title ?? ""} onChange={(e) => update(r.id, { title: e.target.value })} placeholder="Section title" className="bg-neutral-50 rounded px-3 py-2 text-sm border border-neutral-200 outline-none focus:border-gold" />
              <input value={r.subtitle ?? ""} onChange={(e) => update(r.id, { subtitle: e.target.value })} placeholder="Subtitle" className="bg-neutral-50 rounded px-3 py-2 text-sm border border-neutral-200 outline-none focus:border-gold" />
            </div>

            {r.section_type === "hero" && <HeroEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "instagram_reels" && <InstagramEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "product_shelf" && <ShelfEditor config={r.config} products={products} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "categories" && (
              <label className="text-xs flex items-center gap-2">Shape:
                <select value={r.config?.shape || "circle"} onChange={(e) => update(r.id, { config: { ...(r.config || {}), shape: e.target.value } })} className="border rounded px-2 py-1"><option value="circle">Circle</option><option value="square">Square</option></select>
              </label>
            )}
            {r.section_type === "brand_story" && <BrandStoryEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "parents_reviews" && <ParentsReviewsEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "trust_badges" && <p className="text-xs text-neutral-400">Trust badges are managed under <a className="underline" href="/admin/cms">CMS &rarr; Trust badges</a>.</p>}
          </div>
        ))}
      </div>

      {/* Promo popup */}
      <div className="mt-8 bg-white rounded-lg p-4 md:p-5 shadow-soft border-l-4 border-gold">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <h2 className="font-display text-xl text-navy">Site-wide promo popup</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-navy font-bold mb-1">Image</p>
            <ImageUploader value={popup.image_url} folder="promo" onChange={(url) => setPopup({ ...popup, image_url: url })} showUrlField />
          </div>
          <div className="space-y-2">
            <label className="block text-xs">Headline<input value={popup.headline} onChange={(e) => setPopup({ ...popup, headline: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
            <label className="block text-xs">Subtext<input value={popup.subtext} onChange={(e) => setPopup({ ...popup, subtext: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
            <label className="block text-xs">Link URL<input value={popup.link} onChange={(e) => setPopup({ ...popup, link: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs">Delay (sec)<input type="number" value={popup.delay_seconds} onChange={(e) => setPopup({ ...popup, delay_seconds: Number(e.target.value) })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
              <label className="block text-xs">Frequency<select value={popup.frequency} onChange={(e) => setPopup({ ...popup, frequency: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 bg-white"><option value="session">Once per session</option><option value="always">Every visit</option></select></label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs">Start date<input type="date" value={popup.start_date || ""} onChange={(e) => setPopup({ ...popup, start_date: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
              <label className="block text-xs">End date<input type="date" value={popup.end_date || ""} onChange={(e) => setPopup({ ...popup, end_date: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
            </div>
            <label className="flex items-center gap-2 text-sm text-navy mt-2"><input type="checkbox" checked={popup.enabled} onChange={(e) => setPopup({ ...popup, enabled: e.target.checked })} /> Popup enabled</label>
            <button onClick={savePopup} className="bg-navy text-white rounded-lg px-4 py-2 text-sm mt-2">Save popup</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Section editors ---------------- */

function HeroEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const slides = (config?.slides || []) as any[];
  const setSlides = (s: any[]) => onChange({ ...(config || {}), slides: s });
  return (
    <div className="space-y-3">
      {slides.map((sl, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-3 grid md:grid-cols-[220px_1fr_auto] gap-3 items-start">
          <ImageUploader value={sl.image || sl.video || ""} folder="hero" accept="image/*,video/*" maxSizeMB={20} onChange={(url) => setSlides(slides.map((x, j) => j === i ? { ...x, image: /\.(mp4|webm|mov)$/i.test(url) ? "" : url, video: /\.(mp4|webm|mov)$/i.test(url) ? url : "" } : x))} showUrlField />
          <div className="grid grid-cols-1 gap-2">
            <input value={sl.heading || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, heading: e.target.value } : x))} placeholder="Heading" className="border rounded px-2 py-1.5 text-sm" />
            <input value={sl.subheading || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, subheading: e.target.value } : x))} placeholder="Subheading" className="border rounded px-2 py-1.5 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={sl.cta_text || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, cta_text: e.target.value } : x))} placeholder="Button text" className="border rounded px-2 py-1.5 text-xs" />
              <input value={sl.cta_link || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, cta_link: e.target.value } : x))} placeholder="/shop" className="border rounded px-2 py-1.5 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={sl.start_date || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, start_date: e.target.value } : x))} className="border rounded px-2 py-1.5 text-xs" placeholder="Show from" />
              <input type="date" value={sl.end_date || ""} onChange={(e) => setSlides(slides.map((x, j) => j === i ? { ...x, end_date: e.target.value } : x))} className="border rounded px-2 py-1.5 text-xs" placeholder="Show until" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <button onClick={() => { if (i > 0) { const a = [...slides];[a[i], a[i - 1]] = [a[i - 1], a[i]]; setSlides(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (i < slides.length - 1) { const a = [...slides];[a[i], a[i + 1]] = [a[i + 1], a[i]]; setSlides(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
            <button onClick={() => setSlides(slides.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      <button onClick={() => setSlides([...slides, { image: "", heading: "", subheading: "", cta_text: "Shop now", cta_link: "/shop" }])} className="text-sm text-gold flex items-center gap-1"><Plus className="w-4 h-4" /> Add slide</button>
    </div>
  );
}

function InstagramEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const urls = (config?.urls || []) as string[];
  const setUrls = (u: string[]) => onChange({ ...(config || {}), urls: u });
  return (
    <div className="space-y-2">
      {urls.map((u, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={u} onChange={(e) => setUrls(urls.map((x, j) => j === i ? e.target.value : x))} placeholder="https://www.instagram.com/reel/..." className="flex-1 border rounded px-3 py-2 text-sm" />
          <button onClick={() => { if (i > 0) { const a = [...urls];[a[i], a[i - 1]] = [a[i - 1], a[i]]; setUrls(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => { if (i < urls.length - 1) { const a = [...urls];[a[i], a[i + 1]] = [a[i + 1], a[i]]; setUrls(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => setUrls(urls.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <button onClick={() => setUrls([...urls, ""])} className="text-sm text-gold flex items-center gap-1"><Plus className="w-4 h-4" /> Add reel</button>
    </div>
  );
}

function ShelfEditor({ config, products, onChange }: { config: any; products: PickProduct[]; onChange: (c: any) => void }) {
  const filter = config?.filter || "manual";
  const limit = config?.limit ?? 8;
  const selected: string[] = config?.product_ids || [];
  const [q, setQ] = useState("");
  const set = (patch: any) => onChange({ ...(config || {}), ...patch });
  const toggle = (id: string) => set({ product_ids: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] });
  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">Fill from<select value={filter} onChange={(e) => set({ filter: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 bg-white">
          <option value="manual">Manual pick</option>
          <option value="featured">Most Loved (is_featured)</option>
          <option value="new_arrivals">New Arrivals (is_new_arrival)</option>
          <option value="best_sellers">Best Sellers (by order count)</option>
        </select></label>
        <label className="text-xs">Show up to<input type="number" value={limit} onChange={(e) => set({ limit: Number(e.target.value) })} className="mt-1 w-full border rounded px-2 py-1.5" /></label>
      </div>
      {filter === "manual" && (
        <div>
          <div className="flex items-center gap-2 bg-neutral-50 rounded px-2 py-1.5"><Search className="w-3.5 h-3.5 text-neutral-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="flex-1 bg-transparent text-sm outline-none" /></div>
          <div className="max-h-52 overflow-y-auto border rounded mt-2">
            {filtered.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-neutral-100 cursor-pointer hover:bg-cream/40">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="flex-1">{p.name}</span>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-neutral-400 mt-1">{selected.length} selected</p>
        </div>
      )}
    </div>
  );
}

function BrandStoryEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (patch: any) => onChange({ ...(config || {}), ...patch });
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-3">
      <ImageUploader value={config?.image || config?.video || ""} folder="brand-story" accept="image/*,video/*" maxSizeMB={20} onChange={(url) => { if (/\.(mp4|webm|mov)$/i.test(url)) set({ video: url, image: "" }); else set({ image: url, video: "" }); }} showUrlField />
      <div className="space-y-2">
        <label className="text-xs">Or paste Vimeo/YouTube URL<input value={config?.embed_url || ""} onChange={(e) => set({ embed_url: e.target.value })} placeholder="https://vimeo.com/..." className="mt-1 w-full border rounded px-2 py-1.5 text-sm" /></label>
        <label className="text-xs">Body text<textarea rows={4} value={config?.body || ""} onChange={(e) => set({ body: e.target.value })} className="mt-1 w-full border rounded px-2 py-1.5 text-sm" /></label>
      </div>
    </div>
  );
}

function ParentsReviewsEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const videos = (config?.videos || []) as any[];
  const setVideos = (v: any[]) => onChange({ ...(config || {}), videos: v });
  return (
    <div className="space-y-2">
      {videos.map((v, i) => (
        <div key={i} className="border rounded-lg p-3 grid md:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
          <input value={v.url || ""} onChange={(e) => setVideos(videos.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} placeholder="Vimeo / YouTube URL" className="border rounded px-2 py-1.5 text-sm" />
          <input value={v.name || ""} onChange={(e) => setVideos(videos.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Reviewer name" className="border rounded px-2 py-1.5 text-sm" />
          <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={!!v.autoplay_muted} onChange={(e) => setVideos(videos.map((x, j) => j === i ? { ...x, autoplay_muted: e.target.checked } : x))} /> Autoplay muted</label>
          <button onClick={() => setVideos(videos.filter((_, j) => j !== i))} className="p-1.5 text-error"><Trash2 className="w-3.5 h-3.5" /></button>
          <input value={v.caption || ""} onChange={(e) => setVideos(videos.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} placeholder="Short caption (optional)" className="md:col-span-4 border rounded px-2 py-1.5 text-xs" />
        </div>
      ))}
      <button onClick={() => setVideos([...videos, { url: "", name: "", caption: "", autoplay_muted: true }])} className="text-sm text-gold flex items-center gap-1"><Plus className="w-4 h-4" /> Add video review</button>
    </div>
  );
}
