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

const SECTION_INFO: Record<string, { name: string; help: string }> = {
  marquee: { name: "Moving message strip", help: "Short messages that scroll across the top of the page." },
  hero: { name: "Hero banner", help: "The big slides at the top. Upload 1–5 pictures or videos." },
  age_groups: { name: "Shop by age", help: "Round age buttons. Ages come from the product age groups." },
  categories: { name: "Shop by category", help: "Category circles. Pictures are set on each category." },
  promo_strip: { name: "Offer cards", help: "Up to 3 picture cards with a link." },
  product_shelf: { name: "Product row", help: "A row of products: picked by hand, most loved, newest or best sellers." },
  occasions: { name: "Occasions", help: "3 big picture tiles, e.g. Festive, Party, School." },
  gift_corner: { name: "Gift corner", help: "Gift ideas by budget, with a link to gift hampers." },
  shop_the_look: { name: "Shop the look", help: "One styled photo and 2–4 products. Shoppers add the whole outfit in one tap." },
  brand_story: { name: "Our story", help: "Photo or video with the store's story." },
  parents_reviews: { name: "Parent video reviews", help: "Short video reviews from parents." },
  instagram_reels: { name: "Instagram", help: "Your Instagram reels (Vimeo links)." },
  visit_store: { name: "Visit our store", help: "Store photo. Address, hours and phone come from Settings → Contact info." },
  faq: { name: "Parents ask (FAQ)", help: "Questions come from Pages & FAQs. Also helps Google show your answers." },
  join_club: { name: "Join the club", help: "Collects WhatsApp numbers. Shows the first-order code you pick below." },
  sign_off: { name: "Closing line", help: "The big quiet line at the very end of the page. Keep it short." },
  trust_badges: { name: "Trust badges (old)", help: "Replaced by the promises in the footer. Keep it hidden." },
};

export default function HomepageClient({ initial, products, promo, ages = [], coupons = [] }: { initial: Section[]; products: PickProduct[]; promo: any; ages?: { label: string; slug: string }[]; coupons?: string[] }) {
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
        <div><p className="text-xs uppercase tracking-widest text-gold-text font-bold">Homepage</p><h1 className="font-display text-2xl md:text-3xl text-navy tracking-tight">Sections</h1></div>
        <button onClick={saveAllOrder} className="bg-navy text-white rounded-lg px-4 py-2 text-sm">Save order</button>
      </div>

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id} className="bg-white rounded-lg p-4 md:p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5"><button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button><button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-1.5 hover:bg-neutral-100 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button></div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg text-navy leading-tight">{SECTION_INFO[r.section_type]?.name ?? r.section_type.replace(/_/g, " ")}</p>
                {SECTION_INFO[r.section_type]?.help && <p className="text-xs text-muted">{SECTION_INFO[r.section_type].help}</p>}
              </div>
              <button onClick={() => { update(r.id, { is_active: !r.is_active }); }} className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 ${r.is_active ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>{r.is_active ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}</button>
              <button onClick={() => save(r)} className="bg-navy text-white rounded px-3 py-1.5 text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <label className="text-xs text-muted">{r.section_type === "sign_off" ? "Closing line" : "Title"}
                <input value={r.title ?? ""} onChange={(e) => update(r.id, { title: e.target.value })} placeholder={r.section_type === "sign_off" ? "Made with love in Kolhapur." : "Section title"} maxLength={120} className="mt-1 w-full bg-neutral-50 rounded px-3 py-2 text-sm text-ink border border-neutral-200 outline-none focus:border-gold" />
              </label>
              <label className="text-xs text-muted">{r.section_type === "sign_off" ? "Small line under it" : "Short text under the title (optional)"}
                <input value={r.subtitle ?? ""} onChange={(e) => update(r.id, { subtitle: e.target.value })} placeholder="Optional" maxLength={240} className="mt-1 w-full bg-neutral-50 rounded px-3 py-2 text-sm text-ink border border-neutral-200 outline-none focus:border-gold" />
              </label>
            </div>

            {r.section_type === "hero" && <HeroEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "instagram_reels" && <InstagramEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "instagram_reels" && (
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <Field label="Instagram handle shown" value={r.config?.handle || ""} placeholder="@jacknjill_kolhapur" onChange={(v) => update(r.id, { config: { ...(r.config || {}), handle: v } })} />
                <Field label="Instagram profile link" value={r.config?.profile_url || ""} placeholder="https://instagram.com/…" onChange={(v) => update(r.id, { config: { ...(r.config || {}), profile_url: v } })} />
              </div>
            )}
            {r.section_type === "product_shelf" && <ShelfEditor config={r.config} products={products} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "categories" && (
              <label className="text-xs flex items-center gap-2">Shape:
                <select value={r.config?.shape || "circle"} onChange={(e) => update(r.id, { config: { ...(r.config || {}), shape: e.target.value } })} className="border rounded px-2 py-1"><option value="circle">Circle</option><option value="square">Square</option></select>
              </label>
            )}
            {r.section_type === "brand_story" && <BrandStoryEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "parents_reviews" && <ParentsReviewsEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "trust_badges" && <p className="text-xs text-neutral-400">Trust badges are managed under <a className="underline" href="/admin/cms">CMS &rarr; Trust badges</a>.</p>}
            {r.section_type === "marquee" && <MarqueeEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "promo_strip" && <PromoStripEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "age_groups" && <AgeEditor config={r.config} ages={ages} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "occasions" && <OccasionsEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "gift_corner" && <GiftEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "shop_the_look" && <LookEditor config={r.config} products={products} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "visit_store" && <VisitEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "faq" && <FaqEditor config={r.config} onChange={(c) => update(r.id, { config: c })} />}
            {r.section_type === "join_club" && <ClubEditor config={r.config} coupons={coupons} onChange={(c) => update(r.id, { config: c })} />}
          </div>
        ))}
      </div>

      {/* Promo popup */}
      <div className="mt-8 bg-white rounded-lg p-4 md:p-5 shadow-soft border-l-4 border-gold">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gold-text" />
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
  const patch = (i: number, p: any) => setSlides(slides.map((x, j) => j === i ? { ...x, ...p } : x));
  return (
    <div className="space-y-3">
      {slides.map((sl, i) => {
        const mode: "image" | "video" = sl.video_url ? "video" : "image";
        const overlayOpacity = typeof sl.overlay_opacity === "number" ? sl.overlay_opacity : 20;
        const overlayColor = sl.overlay_color || "#1F2650";
        const headingColor = sl.heading_color || "#ffffff";
        const headingSize = sl.heading_size || "lg";
        const ctaStyle = sl.cta_style || "gradient";
        const contentPos = sl.content_position || "left";
        return (
          <div key={i} className="border border-neutral-200 rounded-lg p-3 grid md:grid-cols-[220px_1fr_auto] gap-3 items-start">
            <div className="space-y-2">
              <div className="inline-flex rounded-md overflow-hidden border border-neutral-200 text-[10px]" data-testid={`hero-slide-mode-${i}`}>
                <button type="button" onClick={() => patch(i, { video_url: "" })} className={`px-2 py-1 ${mode === "image" ? "bg-navy text-white" : "bg-white text-navy"}`}>Image</button>
                <button type="button" onClick={() => patch(i, { image: "", video: "" })} className={`px-2 py-1 ${mode === "video" ? "bg-navy text-white" : "bg-white text-navy"}`}>Video</button>
              </div>
              {mode === "image" ? (
                <ImageUploader value={sl.image || sl.video || ""} folder="hero" accept="image/*,video/*" maxSizeMB={20} minWidth={1600} hint="Best: 2400 × 1100 px (wide). Keep faces and products in the middle — phones crop the sides." onChange={(url) => patch(i, /\.(mp4|webm|mov)$/i.test(url) ? { image: "", video: url, video_url: "" } : { image: url, video: "", video_url: "" })} showUrlField />
              ) : (
                <input value={sl.video_url || ""} onChange={(e) => patch(i, { video_url: e.target.value })} placeholder="https://vimeo.com/123456789" className="w-full border rounded px-2 py-1.5 text-xs" />
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <input value={sl.heading || ""} onChange={(e) => patch(i, { heading: e.target.value })} placeholder="Heading" className="border rounded px-2 py-1.5 text-sm" />
              <input value={sl.subheading || ""} onChange={(e) => patch(i, { subheading: e.target.value })} placeholder="Subheading" className="border rounded px-2 py-1.5 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={sl.cta_text || ""} onChange={(e) => patch(i, { cta_text: e.target.value })} placeholder="Button text (optional)" className="border rounded px-2 py-1.5 text-xs" />
                <input value={sl.cta_link || ""} onChange={(e) => patch(i, { cta_link: e.target.value })} placeholder="Button link (optional)" className="border rounded px-2 py-1.5 text-xs" />
              </div>
              <p className="text-[10px] text-neutral-400">Button only shows when both text AND link are set.</p>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={sl.start_date || ""} onChange={(e) => patch(i, { start_date: e.target.value })} className="border rounded px-2 py-1.5 text-xs" placeholder="Show from" />
                <input type="date" value={sl.end_date || ""} onChange={(e) => patch(i, { end_date: e.target.value })} className="border rounded px-2 py-1.5 text-xs" placeholder="Show until" />
              </div>

              {/* Phase O — Overlay + Style controls */}
              <div className="mt-2 border-t border-neutral-200 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="col-span-full text-[10px] uppercase tracking-widest text-navy font-bold">Overlay</div>
                <label className="text-[11px] text-neutral-600">Opacity: <span className="font-bold text-navy">{overlayOpacity}%</span>
                  <input type="range" min={0} max={100} step={5} value={overlayOpacity} onChange={(e) => patch(i, { overlay_opacity: Number(e.target.value) })} className="mt-1 w-full accent-gold" />
                </label>
                <label className="text-[11px] text-neutral-600 flex items-center gap-2">Color
                  <input type="color" value={overlayColor} onChange={(e) => patch(i, { overlay_color: e.target.value })} className="h-8 w-12 border rounded cursor-pointer" />
                  <span className="text-neutral-400">{overlayColor}</span>
                </label>
                <div className="col-span-full text-[10px] uppercase tracking-widest text-navy font-bold mt-1">Style</div>
                <label className="text-[11px] text-neutral-600 flex items-center gap-2">Heading color
                  <input type="color" value={headingColor} onChange={(e) => patch(i, { heading_color: e.target.value })} className="h-8 w-12 border rounded cursor-pointer" />
                </label>
                <label className="text-[11px] text-neutral-600">Heading size
                  <select value={headingSize} onChange={(e) => patch(i, { heading_size: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 bg-white text-xs">
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </label>
                <label className="text-[11px] text-neutral-600">CTA button style
                  <select value={ctaStyle} onChange={(e) => patch(i, { cta_style: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 bg-white text-xs">
                    <option value="gradient">Solid brand gradient</option>
                    <option value="outline">Outline (transparent)</option>
                    <option value="navy">Solid navy</option>
                  </select>
                </label>
                <label className="text-[11px] text-neutral-600">Content position
                  <select value={contentPos} onChange={(e) => patch(i, { content_position: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 bg-white text-xs">
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="text-[11px] text-neutral-600">Corner style
                  <select value={sl.border_radius || "soft"} onChange={(e) => patch(i, { border_radius: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 bg-white text-xs">
                    <option value="none">Square (none)</option>
                    <option value="soft">Soft (12px)</option>
                    <option value="rounded">Rounded (24px)</option>
                    <option value="pill">Pill (40px)</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { if (i > 0) { const a = [...slides];[a[i], a[i - 1]] = [a[i - 1], a[i]]; setSlides(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (i < slides.length - 1) { const a = [...slides];[a[i], a[i + 1]] = [a[i + 1], a[i]]; setSlides(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => setSlides(slides.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      })}
      <button onClick={() => setSlides([...slides, { image: "", video_url: "", heading: "", subheading: "", cta_text: "", cta_link: "", overlay_opacity: 20, overlay_color: "#1F2650", heading_color: "#ffffff", heading_size: "lg", cta_style: "gradient", content_position: "left", border_radius: "soft" }])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add slide</button>
    </div>
  );
}

function InstagramEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const videos = (config?.videos || []) as any[];
  const setVideos = (v: any[]) => onChange({ ...(config || {}), videos: v });
  const patch = (i: number, p: any) => setVideos(videos.map((x, j) => j === i ? { ...x, ...p } : x));
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-500">Vimeo video URLs — rendered chromeless with autoplay.</p>
      {videos.map((v, i) => (
        <div key={i} className="border rounded-lg p-3 grid md:grid-cols-[1fr_120px_auto] gap-2 items-center">
          <input value={v.url || ""} onChange={(e) => patch(i, { url: e.target.value })} placeholder="https://vimeo.com/..." className="border rounded px-2 py-1.5 text-sm" />
          <label className="text-[10px] flex items-center gap-1">
            <input type="checkbox" checked={v.autoplay_muted !== false} onChange={(e) => patch(i, { autoplay_muted: e.target.checked })} />
            Autoplay muted
          </label>
          <div className="flex gap-1">
            <button onClick={() => { if (i > 0) { const a = [...videos];[a[i], a[i - 1]] = [a[i - 1], a[i]]; setVideos(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (i < videos.length - 1) { const a = [...videos];[a[i], a[i + 1]] = [a[i + 1], a[i]]; setVideos(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
            <button onClick={() => setVideos(videos.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      <button onClick={() => setVideos([...videos, { url: "", autoplay_muted: true }])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add video</button>
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
      <ImageUploader value={config?.image || config?.video || ""} folder="brand-story" accept="image/*,video/*" maxSizeMB={20} minWidth={1000} hint="Best: 1500 × 1200 px (slightly wide). Real photo of the store or founder works best." onChange={(url) => { if (/\.(mp4|webm|mov)$/i.test(url)) set({ video: url, image: "" }); else set({ image: url, video: "" }); }} showUrlField />
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
      <button onClick={() => setVideos([...videos, { url: "", name: "", caption: "", autoplay_muted: true }])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add video review</button>
    </div>
  );
}

function MarqueeEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: string[] = (config?.items || []) as string[];
  const set = (arr: string[]) => onChange({ ...(config || {}), items: arr });
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-500">Short rotating brand messages — kept crisp (e.g. Free Shipping ₹999+ • Easy 7-Day Returns).</p>
      {items.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
          <input value={v} onChange={(e) => set(items.map((x, j) => j === i ? e.target.value : x))} placeholder="Message" className="border rounded px-2 py-1.5 text-sm" />
          <button onClick={() => { if (i > 0) { const a = [...items];[a[i], a[i-1]] = [a[i-1], a[i]]; set(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
          <button onClick={() => { if (i < items.length - 1) { const a = [...items];[a[i], a[i+1]] = [a[i+1], a[i]]; set(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
          <button onClick={() => set(items.filter((_, j) => j !== i))} className="p-1.5 text-error"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => set([...items, ""])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add message</button>
        <label className="text-xs text-neutral-500 flex items-center gap-2">Speed (sec)
          <input type="number" min={15} max={120} value={config?.speed_sec || 30} onChange={(e) => onChange({ ...(config || {}), speed_sec: Number(e.target.value) })} className="w-20 border rounded px-2 py-1 text-xs" />
        </label>
      </div>
    </div>
  );
}

function PromoStripEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const cards: any[] = (config?.cards || []) as any[];
  const set = (arr: any[]) => onChange({ ...(config || {}), cards: arr });
  const patch = (i: number, p: any) => set(cards.map((x, j) => j === i ? { ...x, ...p } : x));
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-neutral-500">3 clickable image-backed cards. Stacks on mobile, side-by-side on desktop.</p>
      {cards.map((c, i) => {
        const overlayOpacity = typeof c.overlay_opacity === "number" ? c.overlay_opacity : 55;
        const overlayColor = c.overlay_color || "#1F2650";
        const headingColor = c.heading_color || "#ffffff";
        const radius = c.border_radius || "soft";
        return (
          <div key={i} className="border border-neutral-200 rounded-lg p-3 grid md:grid-cols-[200px_1fr_auto] gap-3 items-start">
            <ImageUploader value={c.image || ""} folder="promo-strip" minWidth={900} hint="Best: wide picture (like 1536 × 1024 or 1280 × 720). Text sits at the bottom-left, keep that area calm." onChange={(url) => patch(i, { image: url })} showUrlField />
            <div className="grid gap-2">
              <input value={c.headline || ""} onChange={(e) => patch(i, { headline: e.target.value })} placeholder="Headline" className="border rounded px-2 py-1.5 text-sm" />
              <input value={c.subtext || ""} onChange={(e) => patch(i, { subtext: e.target.value })} placeholder="Small subtext (optional)" className="border rounded px-2 py-1.5 text-sm" />
              <input value={c.link || ""} onChange={(e) => patch(i, { link: e.target.value })} placeholder="Link (e.g. /shop)" className="border rounded px-2 py-1.5 text-xs" />
              <div className="mt-1 border-t border-neutral-200 pt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="col-span-full text-[10px] uppercase tracking-widest text-navy font-bold">Overlay</div>
                <label className="text-[11px] text-neutral-600">Opacity: <span className="font-bold text-navy">{overlayOpacity}%</span>
                  <input type="range" min={0} max={100} step={5} value={overlayOpacity} onChange={(e) => patch(i, { overlay_opacity: Number(e.target.value) })} className="mt-1 w-full accent-gold" />
                </label>
                <label className="text-[11px] text-neutral-600 flex items-center gap-2">Color
                  <input type="color" value={overlayColor} onChange={(e) => patch(i, { overlay_color: e.target.value })} className="h-8 w-12 border rounded cursor-pointer" />
                  <span className="text-neutral-400">{overlayColor}</span>
                </label>
                <div className="col-span-full text-[10px] uppercase tracking-widest text-navy font-bold mt-1">Style</div>
                <label className="text-[11px] text-neutral-600 flex items-center gap-2">Heading color
                  <input type="color" value={headingColor} onChange={(e) => patch(i, { heading_color: e.target.value })} className="h-8 w-12 border rounded cursor-pointer" />
                </label>
                <label className="text-[11px] text-neutral-600">Corner style
                  <select value={radius} onChange={(e) => patch(i, { border_radius: e.target.value })} className="mt-1 w-full border rounded px-2 py-1 bg-white text-xs">
                    <option value="none">Square (none)</option>
                    <option value="soft">Soft (12px)</option>
                    <option value="rounded">Rounded (24px)</option>
                    <option value="pill">Pill (40px)</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => { if (i > 0) { const a = [...cards];[a[i], a[i-1]] = [a[i-1], a[i]]; set(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (i < cards.length - 1) { const a = [...cards];[a[i], a[i+1]] = [a[i+1], a[i]]; set(a); } }} className="p-1.5 hover:bg-neutral-100 rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => set(cards.filter((_, j) => j !== i))} className="p-1.5 text-error"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      })}
      {cards.length < 3 && (
        <button onClick={() => set([...cards, { image: "", headline: "", subtext: "", link: "", overlay_opacity: 55, overlay_color: "#1F2650", heading_color: "#ffffff", border_radius: "soft" }])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add card</button>
      )}
    </div>
  );
}

/* ---------------- Homepage v2 editors ---------------- */

function Field({ label, value, onChange, placeholder, type = "text", max }: { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; max?: number }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <input type={type} value={value} maxLength={max ?? 160} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
    </label>
  );
}

function AgeEditor({ config, ages, onChange }: { config: any; ages: { label: string; slug: string }[]; onChange: (c: any) => void }) {
  const set = (p: any) => onChange({ ...(config || {}), ...p });
  const hints = (config?.hints || {}) as Record<string, string>;
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Small label above title" value={config?.eyebrow || ""} placeholder="Find the right fit" onChange={(v) => set({ eyebrow: v })} />
        <Field label="Link text (right side)" value={config?.link_text || ""} placeholder="Size help" onChange={(v) => set({ link_text: v })} />
        <Field label="Link goes to" value={config?.link || ""} placeholder="/faq" onChange={(v) => set({ link: v })} />
      </div>
      <p className="text-[11px] text-neutral-500">Small line under each age (optional). Ages themselves are edited with the products.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {ages.map((a) => (
          <Field key={a.slug} label={a.label} value={hints[a.slug] || ""} max={30} placeholder="e.g. Toddler" onChange={(v) => set({ hints: { ...hints, [a.slug]: v } })} />
        ))}
      </div>
    </div>
  );
}

function OccasionsEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const cards: any[] = config?.cards || [];
  const setCards = (arr: any[]) => onChange({ ...(config || {}), cards: arr });
  const patch = (i: number, p: any) => setCards(cards.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-3">
      <Field label="Small label above title" value={config?.eyebrow || ""} placeholder="Collections" onChange={(v) => onChange({ ...(config || {}), eyebrow: v })} />
      {cards.map((c, i) => (
        <div key={i} className="border border-neutral-200 rounded-lg p-3 grid md:grid-cols-[200px_1fr_auto] gap-3 items-start">
          <ImageUploader value={c.image || ""} folder="occasions" minWidth={900} hint="Best: portrait picture (like 1024 × 1536), at least 900 px wide. Keep the bottom third plain — the white name card sits there." onChange={(url) => patch(i, { image: url })} showUrlField />
          <div className="grid gap-2">
            <Field label="Name" value={c.title || ""} placeholder="Festive" max={40} onChange={(v) => patch(i, { title: v })} />
            <Field label="One line about it" value={c.subtitle || ""} placeholder="Kurtas, lehengas and festival sets" max={80} onChange={(v) => patch(i, { subtitle: v })} />
            <Field label="Link (page on this site)" value={c.link || ""} placeholder="/category/clothing" onChange={(v) => patch(i, { link: v })} />
          </div>
          <button onClick={() => setCards(cards.filter((_, j) => j !== i))} className="p-1.5 text-error hover:bg-red-50 rounded" aria-label="Remove card"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      {cards.length < 3 && <button onClick={() => setCards([...cards, { title: "", subtitle: "", image: "", link: "/shop" }])} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add tile</button>}
      <p className="text-[11px] text-neutral-500">Best pictures: tall (portrait), at least 900 px wide.</p>
    </div>
  );
}

function GiftEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const set = (p: any) => onChange({ ...(config || {}), ...p });
  const budgets: any[] = config?.budgets || [];
  const patch = (i: number, p: any) => set({ budgets: budgets.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Small label" value={config?.eyebrow || ""} placeholder="Gift corner" onChange={(v) => set({ eyebrow: v })} />
        <Field label="Button text" value={config?.cta_text || ""} placeholder="See gift hampers" onChange={(v) => set({ cta_text: v })} />
        <Field label="Button link" value={config?.cta_link || ""} placeholder="/category/gift-hampers" onChange={(v) => set({ cta_link: v })} />
      </div>
      <p className="text-[11px] text-neutral-500">Budget tiles open the shop filtered to that price.</p>
      {budgets.map((b, i) => (
        <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2 items-end">
          <Field label="Under ₹" type="number" value={b.amount ?? ""} onChange={(v) => patch(i, { amount: Math.max(0, Math.round(Number(v) || 0)) })} />
          <Field label="Small line" value={b.hint || ""} placeholder="Most gifted" max={30} onChange={(v) => patch(i, { hint: v })} />
          <button onClick={() => set({ budgets: budgets.filter((_, j) => j !== i) })} className="p-2 text-error hover:bg-red-50 rounded" aria-label="Remove budget"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      {budgets.length < 4 && <button onClick={() => set({ budgets: [...budgets, { amount: 2999, hint: "" }] })} className="text-sm text-gold-text flex items-center gap-1"><Plus className="w-4 h-4" /> Add budget</button>}
    </div>
  );
}

function LookEditor({ config, products, onChange }: { config: any; products: PickProduct[]; onChange: (c: any) => void }) {
  const set = (p: any) => onChange({ ...(config || {}), ...p });
  const ids: string[] = config?.product_ids || [];
  const [q, setQ] = useState("");
  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 30);
  const toggle = (id: string) => {
    if (ids.includes(id)) set({ product_ids: ids.filter((x) => x !== id) });
    else if (ids.length < 4) set({ product_ids: [...ids, id] });
    else toast.error("Up to 4 products");
  };
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-3">
      <div>
        <p className="text-xs text-muted mb-1">Styled photo of the whole outfit</p>
        <ImageUploader value={config?.image || ""} folder="shop-the-look" minWidth={1000} hint="Best: square picture (like 1024 × 1024 or bigger). Keep the child in the centre; edges get cropped on phones." onChange={(url) => set({ image: url })} showUrlField />
      </div>
      <div>
        <Field label="Small label" value={config?.eyebrow || ""} placeholder="Complete outfits" onChange={(v) => set({ eyebrow: v })} />
        <p className="text-xs text-muted mt-3 mb-1">Pick 2 to 4 products in the photo ({ids.length} picked). The section hides itself until 2 in-stock products are picked.</p>
        <div className="flex items-center gap-2 bg-neutral-50 rounded px-2 py-1.5"><Search className="w-3.5 h-3.5 text-neutral-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="flex-1 bg-transparent text-sm outline-none" /></div>
        <div className="max-h-52 overflow-y-auto border rounded mt-2">
          {filtered.map((p) => (
            <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-neutral-100 cursor-pointer hover:bg-cream/40">
              <input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="flex-1">{p.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisitEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-3 items-start">
      <ImageUploader value={config?.image || ""} folder="store" minWidth={1200} hint="Best: 1600 × 1200 px (landscape). A real photo of the shop front or inside." onChange={(url) => onChange({ ...(config || {}), image: url })} showUrlField />
      <div className="space-y-2">
        <Field label="Small label" value={config?.eyebrow || ""} placeholder="Visit us" onChange={(v) => onChange({ ...(config || {}), eyebrow: v })} />
        <p className="text-[11px] text-neutral-500">Address, hours and phone come from <a href="/admin/settings" className="underline">Settings → Contact info</a>, so they are always the same everywhere.</p>
      </div>
    </div>
  );
}

function FaqEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="grid sm:grid-cols-[1fr_160px] gap-3 items-end">
      <p className="text-[11px] text-neutral-500">Questions and answers are edited in <a href="/admin/cms" className="underline">Pages &amp; FAQs</a>. Their order there is the order here.</p>
      <Field label="How many to show" type="number" value={config?.limit ?? 6} onChange={(v) => onChange({ ...(config || {}), limit: Math.min(12, Math.max(1, Math.round(Number(v) || 6))) })} />
    </div>
  );
}

function ClubEditor({ config, coupons, onChange }: { config: any; coupons: string[]; onChange: (c: any) => void }) {
  const set = (p: any) => onChange({ ...(config || {}), ...p });
  return (
    <div className="grid sm:grid-cols-3 gap-3 items-end">
      <Field label="Small label" value={config?.eyebrow || ""} placeholder="Jack & Jill club" onChange={(v) => set({ eyebrow: v })} />
      <Field label="Button text" value={config?.button_text || ""} placeholder="Join the club" onChange={(v) => set({ button_text: v })} />
      <label className="block text-xs text-muted">
        Code shown after joining
        <select value={config?.coupon_code || ""} onChange={(e) => set({ coupon_code: e.target.value })} className="mt-1 w-full border border-neutral-200 rounded px-3 py-2 text-sm bg-white text-ink">
          <option value="">No code</option>
          {coupons.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <p className="sm:col-span-3 text-[11px] text-neutral-500">Numbers collected here are listed in Customers → Club members. Only active coupons can be shown.</p>
    </div>
  );
}
