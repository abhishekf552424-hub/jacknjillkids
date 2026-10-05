"use client";
import { safeHref } from "@/components/home/Section";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";

type Popup = {
  enabled: boolean;
  image_url?: string;
  link?: string;
  headline?: string;
  subtext?: string;
  eyebrow?: string;
  cta_text?: string;
  coupon_code?: string;
  theme?: "festive" | "sunny" | "blush";
  frequency?: "session" | "always";
  delay_seconds?: number;
  start_date?: string;
  end_date?: string;
};

// Three looks the admin can pick from. All use the brand palette.
const THEMES = {
  festive: { card: "bg-navy text-white", sub: "text-white/75", eyebrow: "bg-gold text-navy", cta: "bg-brand-yellow text-navy hover:bg-white", ticket: "bg-white/10 border-gold-light/70 text-white", ring: "ring-gold/60" },
  sunny: { card: "bg-butter text-navy", sub: "text-navy/70", eyebrow: "bg-navy text-white", cta: "bg-action text-white hover:bg-action-hover", ticket: "bg-white border-navy/30 text-navy", ring: "ring-gold/40" },
  blush: { card: "bg-blush text-navy", sub: "text-navy/70", eyebrow: "bg-action text-white", cta: "bg-navy text-white hover:bg-ink", ticket: "bg-white border-action/40 text-navy", ring: "ring-action/30" },
} as const;

// Pages where an offer would only get in the way.
const QUIET = [/^\/checkout/, /^\/admin/, /^\/orders\//, /^\/auth/, /^\/track/];

function timeLeft(end?: string) {
  if (!end) return "";
  const ms = new Date(end + "T23:59:59+05:30").getTime() - Date.now();
  if (!(ms > 0) || ms > 1000 * 60 * 60 * 24 * 14) return ""; // only in the last 2 weeks
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  return d > 0 ? `Ends in ${d}d ${h}h` : h > 0 ? `Ends in ${h}h ${m}m` : `Ends in ${m}m`;
}

/** A row of festive flags (toran) along the top of the card. */
function Bunting() {
  const colours = ["#EA4137", "#FCD325", "#F38838", "#B9923F", "#3661A0"];
  return (
    <svg aria-hidden="true" viewBox="0 0 320 26" preserveAspectRatio="none" className="jj-bunting pointer-events-none absolute inset-x-0 top-0 z-10 h-6 w-full">
      <path d="M0 3 Q160 25 320 3" fill="none" stroke="#B9923F" strokeOpacity=".6" strokeWidth="1.2" />
      {Array.from({ length: 11 }).map((_, i) => {
        const x = 8 + i * 30.4;
        const y = 3 + 11 * (1 - Math.pow((x - 160) / 160, 2));
        return <path key={i} d={`M${x - 8} ${y} L${x + 8} ${y} L${x} ${y + 12} Z`} fill={colours[i % colours.length]} style={{ animationDelay: `${i * 45}ms` }} />;
      })}
    </svg>
  );
}

export default function PromoPopup({ popup }: { popup: Popup | null }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!popup?.enabled || open || QUIET.some((r) => r.test(pathname))) return;
    const now = new Date();
    if (popup.start_date && new Date(popup.start_date + "T00:00:00+05:30") > now) return;
    if (popup.end_date && new Date(popup.end_date + "T23:59:59+05:30") < now) return;
    let seen = false;
    try { seen = popup.frequency !== "always" && sessionStorage.getItem("jj_promo_seen") === "1"; } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      try { if (popup.frequency !== "always") sessionStorage.setItem("jj_promo_seen", "1"); } catch {}
    }, Math.max(2, popup.delay_seconds || 3) * 1000);
    return () => clearTimeout(t);
  }, [popup, pathname, open]);

  // While open: Escape closes, the page behind doesn't scroll, focus starts on the close button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    setLeft(timeLeft(popup?.end_date));
    const iv = window.setInterval(() => setLeft(timeLeft(popup?.end_date)), 30000);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; clearInterval(iv); };
  }, [open, popup?.end_date]);

  if (!open || !popup) return null;

  const href = safeHref(popup.link, "/shop");
  const t = THEMES[popup.theme as keyof typeof THEMES] ?? THEMES.festive;
  const hasText = Boolean(popup.headline || popup.subtext || popup.coupon_code);
  const close = () => setOpen(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(popup.coupon_code || ""); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  };

  return (
    <div data-testid="promo-popup" className="jj-pop-backdrop fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center sm:px-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={popup.headline || "Offer"}
        onClick={(e) => e.stopPropagation()}
        className={`jj-pop relative w-full max-h-[92vh] overflow-y-auto overscroll-contain sm:max-w-[680px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl ring-1 ${t.ring} ${hasText ? t.card : "bg-white"}`}
      >
        <button ref={closeRef} onClick={close} aria-label="Close offer" className="absolute top-3 right-3 z-20 grid place-items-center w-9 h-9 rounded-full bg-black/35 text-white hover:bg-black/55 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {!hasText ? (
          // Poster mode: the admin uploaded a finished banner that has its own text.
          popup.image_url ? (
            <a href={href} onClick={close} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={popup.image_url} alt="Offer" className="w-full h-auto max-h-[85vh] object-contain" />
            </a>
          ) : null
        ) : (
          <div className={`relative sm:grid ${popup.image_url ? "sm:grid-cols-[45%_1fr]" : ""}`}>
            <Bunting />
            {popup.image_url && (
              <div className="relative px-6 pt-10 sm:p-6 sm:pt-11">
                {/* Arched window, like a festive doorway */}
                <a href={href} onClick={close} tabIndex={-1} className="jj-pop-in block relative overflow-hidden rounded-t-[999px] rounded-b-[22px] aspect-[16/10] sm:aspect-[4/5] ring-4 ring-white/80 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={popup.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </a>
                <span aria-hidden className="jj-spark absolute left-3 top-12 text-lg text-brand-yellow">✦</span>
                <span aria-hidden className="jj-spark absolute right-3 bottom-3 text-base text-gold-light [animation-delay:700ms]">✦</span>
              </div>
            )}

            <div className={`relative px-6 pb-7 ${popup.image_url ? "pt-4 sm:pt-12 sm:pl-1" : "pt-12"} sm:pr-8 text-center sm:text-left flex flex-col justify-center`}>
              <div className="jj-pop-in" style={{ animationDelay: "120ms" }}>
                {(popup.eyebrow || left) && (
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-3">
                    {popup.eyebrow && <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${t.eyebrow}`}>{popup.eyebrow}</span>}
                    {left && <span className={`text-[11px] font-bold uppercase tracking-wider ${t.sub}`}>{left}</span>}
                  </div>
                )}
                {popup.headline && <h2 className="font-display text-[26px] sm:text-[32px] leading-[1.08]">{popup.headline}</h2>}
                {popup.subtext && <p className={`mt-2 text-sm sm:text-[15px] leading-relaxed ${t.sub}`}>{popup.subtext}</p>}
              </div>

              {popup.coupon_code && (
                <button
                  type="button"
                  onClick={copy}
                  data-testid="promo-coupon"
                  className={`jj-pop-in jj-ticket relative mt-5 w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed px-5 py-3 ${t.ticket}`}
                  style={{ animationDelay: "220ms" }}
                  aria-label={`Copy coupon code ${popup.coupon_code}`}
                >
                  <span className="text-left">
                    <span className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${t.sub}`}>Use code</span>
                    <span className="block font-mono text-lg font-extrabold tracking-[0.12em]">{popup.coupon_code}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold" aria-live="polite">
                    {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Tap to copy</>}
                  </span>
                </button>
              )}

              <div className="jj-pop-in mt-5 flex flex-col sm:flex-row items-center gap-3" style={{ animationDelay: "320ms" }}>
                <a href={href} onClick={close} className={`w-full sm:w-auto text-center rounded-full px-7 py-3 text-sm font-extrabold shadow-premium transition-colors ${t.cta}`}>
                  {popup.cta_text || "Shop the collection"}
                </a>
                <button type="button" onClick={close} className={`text-xs font-bold underline underline-offset-4 ${t.sub}`}>Maybe later</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
