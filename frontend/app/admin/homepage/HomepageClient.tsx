"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Save, Eye, EyeOff } from "lucide-react";

type S = {
  id: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  config: any;
  sort_order: number;
  is_active: boolean;
};

export default function HomepageClient({ initial }: { initial: S[] }) {
  const [rows, setRows] = useState<S[]>(initial);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const arr = [...rows];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((r, k) => (r.sort_order = k + 1));
    setRows(arr);
  };

  const save = async (r: S) => {
    const res = await fetch(`/api/admin/homepage/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: r.title, subtitle: r.subtitle, config: r.config, is_active: r.is_active, sort_order: r.sort_order }),
    });
    if (!res.ok) return toast.error("Save failed");
    toast.success("Saved");
  };

  const saveAllOrder = async () => {
    await Promise.all(rows.map((r) => save(r)));
    toast.success("Order saved");
  };

  const update = (id: string, patch: Partial<S>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Homepage</p>
          <h1 className="font-display text-3xl text-navy tracking-tight">Sections</h1>
        </div>
        <button onClick={saveAllOrder} className="bg-navy text-white rounded px-4 py-2 text-sm">Save order</button>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id} className="bg-white rounded-lg p-4 shadow-soft flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-navy hover:bg-cream rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-2 text-navy hover:bg-cream rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-gold font-bold">{r.section_type.replace(/_/g, " ")}</p>
              <input value={r.title ?? ""} onChange={(e) => update(r.id, { title: e.target.value })} placeholder="Section title" className="mt-1 w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
              <input value={r.subtitle ?? ""} onChange={(e) => update(r.id, { subtitle: e.target.value })} placeholder="Subtitle (optional)" className="mt-2 w-full bg-cream rounded px-3 py-2 text-sm border border-navy/10 outline-none focus:border-gold" />
              <details className="mt-2 text-xs">
                <summary className="text-gold cursor-pointer">Advanced config (JSON)</summary>
                <textarea rows={4} value={JSON.stringify(r.config, null, 2)} onChange={(e) => { try { update(r.id, { config: JSON.parse(e.target.value) }); } catch {} }} className="mt-1 w-full font-mono text-xs bg-cream rounded p-2 border border-navy/10 outline-none focus:border-gold" />
              </details>
            </div>
            <div className="flex md:flex-col gap-2">
              <button onClick={() => update(r.id, { is_active: !r.is_active })} className={`px-3 py-2 rounded text-xs flex items-center gap-1 ${r.is_active ? "bg-success/10 text-success" : "bg-navy/5 text-muted"}`}>
                {r.is_active ? <><Eye className="w-3 h-3" /> Visible</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
              </button>
              <button onClick={() => save(r)} className="bg-navy text-white rounded px-3 py-2 text-xs flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
