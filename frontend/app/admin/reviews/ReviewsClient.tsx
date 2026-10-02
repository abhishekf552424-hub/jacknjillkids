"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Star } from "lucide-react";

export default function ReviewsClient({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState(initial);

  const act = async (id: string, is_approved: boolean) => {
    const r = await fetch(`/api/admin/reviews/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ is_approved }) });
    if (!r.ok) return toast.error("Failed");
    setRows(rows.map((x) => x.id === id ? { ...x, is_approved } : x));
    toast.success(is_approved ? "Approved" : "Rejected");
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const r = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("Failed");
    setRows(rows.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="mb-4"><p className="text-xs uppercase tracking-wider text-gold-text font-bold">Marketing</p><h1 className="font-display text-2xl md:text-3xl text-navy">Reviews</h1><p className="text-sm text-muted mt-1">New reviews stay hidden until you press ✓. Press ✕ to hide one again.</p></div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-neutral-400">No reviews yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-lg p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-gold-text">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating || 0) ? "fill-current" : "opacity-30"}`} />))}</div>
                <p className="text-sm font-semibold text-navy mt-1 flex items-center gap-2 flex-wrap">
                  {r.author_name || "Anonymous"}
                  {r.is_verified && <span className="text-[11px] font-semibold text-success bg-success/10 rounded-full px-2 py-0.5">Verified buyer</span>}
                  <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${r.is_approved ? "bg-success/10 text-success" : "bg-butter text-warning"}`}>{r.is_approved ? "Shown on site" : "Waiting for approval"}</span>
                </p>
                <p className="text-xs text-muted">
                  <a href={`/product/${r.product?.slug}`} target="_blank" className="underline">{r.product?.name}</a> · {new Date(r.created_at).toLocaleDateString("en-IN")}
                </p>
                {r.comment && <p className="text-sm text-ink mt-2 whitespace-pre-line">{r.comment}</p>}
                {r.images?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">{r.images.map((im: any, i: number) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img key={i} src={im.url} alt="" className="w-20 h-20 object-cover rounded" />
                  ))}</div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => act(r.id, true)} className={`p-1.5 rounded ${r.is_approved ? "bg-green-100 text-green-700" : "bg-green-50 text-green-700 hover:bg-green-100"}`} title="Approve"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => act(r.id, false)} className={`p-1.5 rounded ${!r.is_approved ? "bg-neutral-100 text-neutral-500" : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100"}`} title="Hide"><X className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50" title="Delete">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
