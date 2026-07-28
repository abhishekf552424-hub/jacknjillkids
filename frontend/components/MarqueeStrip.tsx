"use client";

import { Sparkles } from "lucide-react";

type Item = { text?: string; emoji?: string };

export default function MarqueeStrip({
  items,
  title,
  speedSec,
}: {
  items: (string | Item)[];
  title?: string | null;
  speedSec?: number;
}) {
  const list = (items ?? []).map((i) => (typeof i === "string" ? { text: i } : i)).filter((i) => i.text);
  if (list.length === 0) return null;
  // Duplicate for seamless infinite scroll
  const seq = [...list, ...list];
  const duration = Math.max(15, speedSec || Math.min(60, list.length * 6));

  return (
    <section aria-label={title || "Announcements"} className="bg-navy text-white overflow-hidden marquee-wrap" data-testid="marquee-strip">
      <div className="relative flex whitespace-nowrap">
        <div
          className="marquee-track flex whitespace-nowrap py-3"
          style={{ ["--marquee-duration" as any]: `${duration}s` }}
        >
          {seq.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-6 text-sm md:text-base font-bold" data-testid={i < list.length ? `marquee-item-${i}` : undefined}>
              <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="opacity-95">{it.text}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
