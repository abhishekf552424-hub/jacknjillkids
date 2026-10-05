"use client";
import { useEffect, useState } from "react";

/**
 * "Open now · closes 9 pm" pill worked out from the store hours text
 * (e.g. "Mon–Sun, 10am–9pm"), in India time. Rendered only in the browser,
 * so the server HTML never disagrees with the visitor's clock.
 */
function parse(hours?: string) {
  const m = (hours || "").match(/(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\s*[–—-]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)/i);
  if (!m) return null;
  const toMin = (h: string, mm: string | undefined, ap: string) => ((Number(h) % 12) + (ap.toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(mm || 0);
  return { open: toMin(m[1], m[2], m[3]), close: toMin(m[4], m[5], m[6]) };
}

const label = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`;
};

export default function OpenNow({ hours }: { hours?: string }) {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const t = parse(hours);
    if (!t) return;
    const tick = () => {
      const ist = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
      const now = ist.getHours() * 60 + ist.getMinutes();
      if (now >= t.open && now < t.close) {
        const left = t.close - now;
        setState({ open: true, text: left <= 60 ? `Open now · closes in ${left} min` : `Open now · till ${label(t.close)}` });
      } else {
        setState({ open: false, text: `Closed now · opens ${now < t.open ? "today" : "tomorrow"} at ${label(t.open)}` });
      }
    };
    tick();
    const iv = window.setInterval(tick, 60000);
    return () => clearInterval(iv);
  }, [hours]);

  if (!state) return null;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${state.open ? "bg-[#1F7A4A]/25 text-[#9FE3BF]" : "bg-white/10 text-white/80"}`} data-testid="open-now">
      <span className={`relative inline-flex w-2 h-2 rounded-full ${state.open ? "bg-[#4ADE80]" : "bg-white/50"}`}>
        {state.open && <span className="absolute inset-0 rounded-full bg-[#4ADE80] animate-ping opacity-60" />}
      </span>
      {state.text}
    </span>
  );
}
