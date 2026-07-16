"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function CmsList({ pages, faqs, badges }: { pages: any[]; faqs: any[]; badges: any[] }) {
  const [tab, setTab] = useState<"pages" | "faqs" | "badges">("pages");
  const [P, setP] = useState(pages);
  const [F, setF] = useState(faqs);
  const [B, setB] = useState(badges);

  const savePage = async (p: any) => {
    const r = await fetch(`/api/admin/cms/pages/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: p.title, content: p.content, meta_title: p.meta_title, meta_description: p.meta_description }),
    });
    if (!r.ok) return toast.error("Save failed");
    toast.success("Saved");
  };

  const saveFaq = async (f: any) => {
    const r = await fetch(`/api/admin/cms/faqs${f.id ? `/${f.id}` : ""}`, {
      method: f.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    if (!r.ok) return toast.error("Save failed");
    toast.success("Saved");
  };

  const saveBadge = async (b: any) => {
    const r = await fetch(`/api/admin/cms/badges${b.id ? `/${b.id}` : ""}`, {
      method: b.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    });
    if (!r.ok) return toast.error("Save failed");
    toast.success("Saved");
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Content</p>
      <h1 className="font-display text-3xl text-navy tracking-tight">CMS</h1>
      <div className="mt-4 flex gap-2 border-b border-navy/10">
        {(["pages", "faqs", "badges"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm capitalize ${tab === t ? "border-b-2 border-gold text-gold font-medium" : "text-muted"}`}>{t}</button>
        ))}
      </div>

      {tab === "pages" && (
        <div className="mt-6 space-y-4">
          {P.map((p, i) => (
            <div key={p.id} className="bg-white rounded-lg p-5 shadow-soft">
              <p className="text-xs uppercase tracking-widest text-gold font-bold">/legal/{p.slug}</p>
              <input value={p.title} onChange={(e) => setP(P.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="mt-1 w-full font-display text-lg bg-cream rounded px-3 py-2 border border-navy/10 outline-none focus:border-gold" />
              <textarea rows={8} value={p.content ?? ""} onChange={(e) => setP(P.map((x, j) => j === i ? { ...x, content: e.target.value } : x))} className="mt-2 w-full text-sm bg-cream rounded px-3 py-2 border border-navy/10 outline-none focus:border-gold" />
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                <input placeholder="Meta title" value={p.meta_title ?? ""} onChange={(e) => setP(P.map((x, j) => j === i ? { ...x, meta_title: e.target.value } : x))} className="bg-cream rounded px-3 py-2 text-xs border border-navy/10 outline-none focus:border-gold" />
                <input placeholder="Meta description" value={p.meta_description ?? ""} onChange={(e) => setP(P.map((x, j) => j === i ? { ...x, meta_description: e.target.value } : x))} className="bg-cream rounded px-3 py-2 text-xs border border-navy/10 outline-none focus:border-gold" />
              </div>
              <button onClick={() => savePage(p)} className="mt-3 bg-navy text-white rounded px-4 py-2 text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            </div>
          ))}
        </div>
      )}

      {tab === "faqs" && (
        <div className="mt-6">
          <button onClick={() => setF([...F, { question: "", answer: "", page_context: "general", sort_order: F.length + 1, is_active: true }])} className="bg-navy text-white rounded px-4 py-2 text-sm mb-4">+ Add FAQ</button>
          <div className="space-y-3">
            {F.map((f, i) => (
              <div key={f.id ?? `n-${i}`} className="bg-white rounded-lg p-4 shadow-soft space-y-2">
                <input placeholder="Question" value={f.question} onChange={(e) => setF(F.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} className="w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
                <textarea rows={3} placeholder="Answer" value={f.answer} onChange={(e) => setF(F.map((x, j) => j === i ? { ...x, answer: e.target.value } : x))} className="w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
                <button onClick={() => saveFaq(f)} className="bg-navy text-white rounded px-3 py-1.5 text-xs">Save</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "badges" && (
        <div className="mt-6">
          <button onClick={() => setB([...B, { icon: "Award", label: "", subtext: "", sort_order: B.length + 1, is_active: true }])} className="bg-navy text-white rounded px-4 py-2 text-sm mb-4">+ Add badge</button>
          <div className="grid sm:grid-cols-2 gap-3">
            {B.map((b, i) => (
              <div key={b.id ?? `n-${i}`} className="bg-white rounded-lg p-4 shadow-soft space-y-2">
                <input placeholder="Icon name (lucide)" value={b.icon ?? ""} onChange={(e) => setB(B.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} className="w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
                <input placeholder="Label" value={b.label} onChange={(e) => setB(B.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
                <input placeholder="Subtext" value={b.subtext ?? ""} onChange={(e) => setB(B.map((x, j) => j === i ? { ...x, subtext: e.target.value } : x))} className="w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
                <button onClick={() => saveBadge(b)} className="bg-navy text-white rounded px-3 py-1.5 text-xs">Save</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
