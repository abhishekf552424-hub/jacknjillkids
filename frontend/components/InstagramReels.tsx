"use client";

import { useState } from "react";
import Rail from "./Rail";
import { instagramHandle } from "@/lib/social";
import { Instagram } from "lucide-react";
import { normalizeEmbedUrl } from "@/lib/embeds";
import BrandLoader from "@/components/BrandLoader";
import { SectionHeader, type Tone } from "./home/Section";

type Video = { url: string; autoplay_muted?: boolean };

export default function InstagramReels({
  title,
  subtitle,
  videos,
  tone = "cream",
  handle,
  profileUrl,
  instagram,
}: {
  instagram?: string;
  tone?: Tone;
  handle?: string;
  profileUrl?: string;
  title?: string | null;
  subtitle?: string | null;
  videos?: Video[];
}) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const items: Video[] = (videos ?? []).filter((v) => v.url);
  const igUrl = (profileUrl && /^https:\/\//.test(profileUrl) ? profileUrl : undefined) || instagram;
  const igHandle = handle || instagramHandle(igUrl);

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
    <section className={`${tone === "white" ? "bg-white" : "bg-cream"} py-12 md:py-20`} data-testid="instagram-reels">
      <div className="container">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <SectionHeader eyebrow="On Instagram" title={title || "From our Instagram"} subtitle={subtitle} />
        </div>
        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-7 md:mb-9 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-soft transition-colors hover:bg-navy hover:text-white"
            data-testid="instagram-profile-link"
          >
            <Instagram className="w-4 h-4" /> Follow {igHandle || "us"}
          </a>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gold/40 bg-cream/40 p-10 text-center text-sm text-muted">
          No videos added yet.
        </div>
      ) : (
        <div data-testid="instagram-reels-scroll">
          <Rail label={title || "From our Instagram"} itemClassName="w-[62%] sm:w-[34%] md:w-[26%] lg:w-[19.2%]" gapClassName="gap-4 md:gap-5">
            {items.map((v, i) => (
              <div key={`${v.url}-${i}`} data-testid={`instagram-reel-${i}`}>
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
          </Rail>
        </div>
      )}
      </div>
    </section>
  );
}
