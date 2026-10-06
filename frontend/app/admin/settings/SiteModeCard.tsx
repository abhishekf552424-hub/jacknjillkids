"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Rocket, Eye, Hourglass, ExternalLink } from "lucide-react";

/**
 * Website status: "Coming soon" (only signed-in admins see the shop) or
 * "Live" (everyone). Going live asks for a second click, so it is always a
 * deliberate decision — ideally made with the client watching.
 */
export default function SiteModeCard({ initial }: { initial?: { live?: boolean; changed_at?: string } }) {
  const [live, setLive] = useState(initial?.live === true);
  const [changedAt, setChangedAt] = useState(initial?.changed_at || "");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const setMode = async (next: boolean) => {
    setBusy(true);
    const value = { live: next, changed_at: new Date().toISOString() };
    const r = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "site_mode", value }) });
    setBusy(false);
    setConfirming(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      return toast.error(j.error || "Could not change the website status");
    }
    setLive(next);
    setChangedAt(value.changed_at);
    toast.success(next ? "The website is LIVE for everyone 🎉 (takes up to 15 seconds)" : "Back to Coming soon. Only the team can see the shop now.");
  };

  const when = changedAt ? new Date(changedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "";

  return (
    <section id="site-mode" className={`mt-6 rounded-2xl p-5 md:p-6 shadow-soft border-2 ${live ? "bg-[#ECF8F1] border-[#1F7A4A]/30" : "bg-butter/70 border-gold/40"}`} data-testid="site-mode-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid place-items-center w-11 h-11 rounded-full shrink-0 ${live ? "bg-[#1F7A4A] text-white" : "bg-navy text-brand-yellow"}`}>
            {live ? <Rocket className="w-5 h-5" /> : <Hourglass className="w-5 h-5" />}
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Website status</p>
            <h2 className="font-display text-2xl text-navy">{live ? "Live: open to everyone" : "Coming soon"}</h2>
            <p className="text-sm text-muted mt-1 max-w-xl">
              {live
                ? "Customers can browse and order on jacknjillkids.com."
                : "Customers see a “Coming soon” page with the store address and WhatsApp. You (signed in here) see the full shop, so you can show it to the client first."}
            </p>
            {when && <p className="text-xs text-muted mt-1">Last changed: {when}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-4 py-2 text-sm font-bold text-navy hover:border-navy/40">
            <Eye className="w-4 h-4" /> Preview shop <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
          {live ? (
            <button disabled={busy} onClick={() => setMode(false)} className="rounded-full border border-navy/20 bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-cream disabled:opacity-50" data-testid="site-mode-soon">
              Switch back to Coming soon
            </button>
          ) : !confirming ? (
            <button disabled={busy} onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-full bg-[#1F7A4A] hover:bg-[#186540] px-5 py-2.5 text-sm font-extrabold text-white shadow-premium disabled:opacity-50" data-testid="site-mode-golive">
              <Rocket className="w-4 h-4" /> Make website live
            </button>
          ) : null}
        </div>
      </div>

      {!live && confirming && (
        <div className="mt-4 rounded-xl bg-white border border-[#1F7A4A]/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy">
            <b>Go live now?</b> Everyone visiting jacknjillkids.com will see the new shop and can place orders.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirming(false)} className="rounded-full px-4 py-2 text-sm font-bold text-navy hover:bg-cream">Not yet</button>
            <button disabled={busy} onClick={() => setMode(true)} className="rounded-full bg-[#1F7A4A] hover:bg-[#186540] px-5 py-2 text-sm font-extrabold text-white disabled:opacity-50" data-testid="site-mode-confirm">
              {busy ? "Going live…" : "Yes, go live 🚀"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
