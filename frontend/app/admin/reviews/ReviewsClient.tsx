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
      <div className="mb-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Community</p><h1 className="font-display text-2xl md:text-3xl text-navy">Reviews</h1></div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-neutral-400">No reviews yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="bg-white rounded-lg p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-gold">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`w-3.5 h-3.5 ${i < (r.rating || 0) ? "fill-current" : "opacity-30"}`} />))}</div>
                <p className="text-sm font-medium text-navy mt-1">{r.title || "(no title)"}</p>
                <p className="text-xs text-neutral-500">{r.reviewer_name || r.email || "Anonymous"} • <a href={`/product/${r.product?.slug}`} className="underline">{r.product?.name}</a></p>
                <p className="text-sm text-neutral-700 mt-2">{r.body}</p>
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
