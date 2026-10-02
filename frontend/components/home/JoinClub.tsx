"use client";

import { useState } from "react";
import { Loader2, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { HomeSection, type Tone } from "./Section";

export default function JoinClub({ title, subtitle, config, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; button_text?: string }; tone?: Tone }) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null | undefined>(undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return toast.error("Please tick the box so we can message you");
    setBusy(true);
    try {
      const r = await fetch("/api/club", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, consent }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return toast.error(j.error || "Could not join. Please try again.");
      setCode(j.coupon_code ?? null);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      /* the code is on screen anyway */
    }
  };

  return (
    <HomeSection tone={tone} testid="join-club">
      <div className="grid items-center gap-7 rounded-[28px] bg-butter p-7 md:p-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B]">{config?.eyebrow || "Jack & Jill club"}</p>
          <h2 className="font-display text-[28px] md:text-4xl leading-[1.1] text-navy text-balance">{title || "Join the Jack & Jill club"}</h2>
          <p className="text-muted leading-relaxed max-w-xl">{subtitle || "New arrivals, festival offers and a birthday surprise for your child, on WhatsApp."}</p>
        </div>
        {code === undefined ? (
          <form onSubmit={submit} className="grid gap-2.5">
            <label htmlFor="club-phone" className="text-sm font-extrabold text-navy">WhatsApp number</label>
            <div className="flex flex-wrap gap-2.5">
              <input
                id="club-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+ ]/g, "").slice(0, 15))}
                placeholder="98765 43210"
                className="min-w-0 flex-[1_1_200px] rounded-full border border-line bg-white px-5 py-3.5 text-base font-semibold text-ink outline-none focus:border-navy"
              />
              <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-full bg-action hover:bg-action-hover text-white px-6 py-3.5 text-[15px] font-bold disabled:opacity-60">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} {config?.button_text || "Join the club"}
              </button>
            </div>
            <label className="flex items-start gap-2 text-[13px] text-muted">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-navy" />
              Yes, Jack &amp; Jill may send me offers on WhatsApp. I can stop any time.
            </label>
          </form>
        ) : (
          <div className="page-in rounded-[20px] bg-white p-6 grid gap-3" role="status">
            <p className="flex items-center gap-2 font-display text-xl text-navy">
              <Check className="w-5 h-5 text-success pop" /> Welcome to the club!
            </p>
            {code ? (
              <>
                <p className="text-sm text-muted">Your first-order code:</p>
                <button onClick={copy} className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-dashed border-navy px-5 py-2.5 font-display text-lg text-navy">
                  {code} <Copy className="w-4 h-4" aria-hidden="true" />
                </button>
                <p className="text-xs text-muted">Use it at checkout.</p>
              </>
            ) : (
              <p className="text-sm text-muted">We&apos;ll send you our next offer on WhatsApp.</p>
            )}
          </div>
        )}
      </div>
    </HomeSection>
  );
}
