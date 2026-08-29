"use client";

import { useRef, useState } from "react";
import { Instagram } from "lucide-react";
import { normalizeEmbedUrl } from "@/lib/embeds";
import BrandLoader from "@/components/BrandLoader";

type Video = { url: string; autoplay_muted?: boolean };

export default function InstagramReels({
  title,
  subtitle,
  videos,
}: {
  title?: string | null;
  subtitle?: string | null;
  videos?: Video[];
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const items: Video[] = (videos ?? []).filter((v) => v.url);

  // Build chromeless Vimeo embed URL with autoplay/loop/muted params
  const getChromelessUrl = (v: Video): string => {
    const base = normalizeEmbedUrl(v.url);
    if (!base) return "";
    const url = new URL(base);
    if (v.autoplay_muted !== false) {
      url.searchParams.set("autoplay", "1");
      url.searchParams.set("muted", "1");
    }
    url.searchParams.set("loop", "1");
    url.searchParams.set("background", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("playsinline", "1");
    return url.toString();
  };

  return (
    <section className="container py-16 md:py-20" data-testid="instagram-reels">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Video Gallery</p>
          <h2 className="font-display text-3xl md:text-4xl text-navy tracking-tight">{title ?? "From Our Feed"}</h2>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
        <a
          href="https://instagram.com/jacknjill_kolhapur"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-navy hover:text-gold transition-colors"
          data-testid="instagram-profile-link"
        >
          <Instagram className="w-4 h-4" /> @jacknjill_kolhapur
        </a>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gold/40 bg-cream/40 p-10 text-center text-sm text-muted">
          No videos added yet.
        </div>
      ) : (
        <div
          ref={scroll}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
          data-testid="instagram-reels-scroll"
        >
          {items.map((v, i) => (
            <div
              key={`${v.url}-${i}`}
              className="w-[220px] md:w-[260px] snap-start flex-shrink-0"
              data-testid={`instagram-reel-${i}`}
            >
              <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-cream shadow-soft">
                {!loaded[i] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cream">
                    <BrandLoader size="md" />
                  </div>
                )}
                <iframe
                  src={getChromelessUrl(v)}
                  className="absolute inset-0 w-full h-full"
                  frameBorder={0}
                  allow="autoplay; fullscreen; picture-in-picture"
                  loading="lazy"
                  title={`Video ${i + 1}`}
                  onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
