"use client";

import { useState } from "react";
import { BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/** Shown when nothing can be bought right now: email alert + ask on WhatsApp. */
export default function NotifyMe({ productId, productName, whatsapp }: { productId: string; productName: string; whatsapp?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const digits = (whatsapp || "").replace(/\D/g, "");
  const wa = digits
    ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}?text=${encodeURIComponent(`Hi Jack & Jill, is "${productName}" available? I'd like to buy it.`)}`
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/stock-notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product_id: productId, email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return toast.error(j.error || "Could not save");
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-line bg-cream/60 p-4" data-testid="notify-me">
      {done ? (
        <p className="flex items-center gap-2 text-sm text-navy">
          <CheckCircle2 className="w-5 h-5 text-success" /> Done! We&apos;ll email you as soon as it&apos;s available.
        </p>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm font-semibold text-navy">
            <BellRing className="w-4 h-4 text-brand-orange" /> Get an email when this is available
          </p>
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <label className="flex-1">
              <span className="sr-only">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </label>
            <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-navy text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Notify me
            </button>
          </form>
        </>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-success hover:underline">
          <WhatsAppIcon className="w-4 h-4" /> Ask on WhatsApp, we may have it in store
        </a>
      )}
    </div>
  );
}
