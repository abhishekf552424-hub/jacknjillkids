"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function SupportClient({ initial }: { initial: any[] }) {
  const [tickets, setTickets] = useState(initial);
  const [active, setActive] = useState<any | null>(initial[0] || null);
  const [reply, setReply] = useState("");

  const changeStatus = async (id: string, status: string) => {
    const r = await fetch(`/api/admin/support/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (!r.ok) return toast.error("Failed");
    setTickets(tickets.map((t) => t.id === id ? { ...t, status } : t));
    if (active?.id === id) setActive({ ...active, status });
  };
  const send = async () => {
    if (!reply.trim() || !active) return;
    const r = await fetch(`/api/admin/support/${active.id}/reply`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body: reply }) });
    if (!r.ok) return toast.error("Failed");
    const j = await r.json();
    setActive({ ...active, msgs: [...(active.msgs || []), j.message] });
    setReply(""); toast.success("Sent");
  };

  return (
    <div>
      <div className="mb-4"><p className="text-xs uppercase tracking-widest text-gold font-bold">Care</p><h1 className="font-display text-2xl md:text-3xl text-navy">Support</h1></div>
      <div className="grid md:grid-cols-[300px_1fr] gap-4">
        <div className="bg-white rounded-lg shadow-soft max-h-[70vh] overflow-y-auto">
          {tickets.length === 0 && <p className="p-4 text-sm text-neutral-400">No tickets yet.</p>}
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left p-3 border-b border-neutral-100 ${active?.id === t.id ? "bg-cream" : "hover:bg-neutral-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0"><p className="text-sm font-medium text-navy truncate">{t.subject}</p><p className="text-xs text-neutral-500 truncate">{t.email}</p></div>
                <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ${t.status === "resolved" ? "bg-green-50 text-green-700" : t.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-yellow-50 text-yellow-700"}`}>{t.status.replace(/_/g, " ")}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-soft p-4 min-h-[300px]">
          {!active ? <p className="text-sm text-neutral-400">Select a ticket</p> : (
            <>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div><p className="font-display text-lg text-navy">{active.subject}</p><p className="text-xs text-neutral-500">{active.email}</p></div>
                <select value={active.status} onChange={(e) => changeStatus(active.id, e.target.value)} className="text-xs border rounded px-2 py-1 bg-white">
                  <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-2 mb-3 max-h-[45vh] overflow-y-auto">
                {(active.msgs || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((m: any) => (
                  <div key={m.id} className={`rounded-lg p-3 text-sm ${m.author_role === "admin" ? "bg-navy text-white ml-8" : "bg-cream text-navy mr-8"}`}><p>{m.body}</p><p className={`text-[10px] mt-1 ${m.author_role === "admin" ? "text-white/60" : "text-neutral-500"}`}>{new Date(m.created_at).toLocaleString("en-IN")}</p></div>
                ))}
              </div>
              <div className="border-t pt-3">
                <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to customer…" className="w-full border rounded px-3 py-2 text-sm" />
                <button onClick={send} disabled={!reply.trim()} className="mt-2 bg-navy text-white rounded px-4 py-2 text-sm disabled:opacity-50">Send reply</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
