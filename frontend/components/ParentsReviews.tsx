"use client";

import { Play } from "lucide-react";
import Rail from "./Rail";
import { GoogleRating } from "./SocialLinks";
import type { Social } from "@/lib/social";
import { normalizeEmbedUrl } from "@/lib/embeds";
import { SectionHeader, type Tone } from "./home/Section";

type Video = { url: string; name?: string; caption?: string; autoplay?: boolean };

export default function ParentsReviews({
  title,
  subtitle,
  tone = "white",
  videos,
  social = {},
}: {
  social?: Social;
  title?: string | null;
  subtitle?: string | null;
  tone?: Tone;
  videos?: Video[];
}) {
  // Only real reviews: the parents' videos added in Admin, plus the live Google rating.
  const list: Video[] = (videos ?? []).filter((v) => v?.url || v?.caption);
  const hasGoogle = Boolean(social.google_rating && social.google_reviews_url);
  if (!list.length && !hasGoogle) return null;

  return (
    <section className={`${tone === "white" ? "bg-white" : "bg-cream"} py-12 md:py-20`} data-testid="parents-reviews">
      <div className="container">
        <SectionHeader eyebrow="Real parents" title={title || "Real parents, real stories"} subtitle={subtitle} center />
        {hasGoogle && (
          <div className="-mt-3 mb-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <GoogleRating social={social} />
            {social.google_write_url && (
              <a href={social.google_write_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-navy underline decoration-brand-yellow decoration-2 underline-offset-4 hover:text-action">
                Shopped with us? Write a review
              </a>
            )}
          </div>
        )}
        {list.length > 0 && (
        <Rail label={title || "Real parents, real stories"} itemClassName="w-[86%] sm:w-[48%] lg:w-[32%]" gapClassName="gap-4 md:gap-6">
          {list.map((v, i) => (
            <div
              key={i}
              className="h-full bg-white rounded-lg shadow-soft border border-navy/5 overflow-hidden hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-video bg-navy flex items-center justify-center overflow-hidden">
                {v.url ? (
                  <iframe
                    src={normalizeEmbedUrl(v.url)}
                    className="absolute inset-0 w-full h-full"
                    frameBorder={0}
                    allow="autoplay; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={v.name || "Testimonial"}
                  />
                ) : (
                  <div className="text-white/70 flex flex-col items-center gap-2 text-sm">
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-6 h-6" />
                    </div>
                    <span>Video coming soon</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-navy font-bold">{v.name}</p>
                {v.caption && <p className="text-sm text-muted mt-1 leading-relaxed">&ldquo;{v.caption}&rdquo;</p>}
              </div>
            </div>
          ))}
        </Rail>
        )}
      </div>
    </section>
  );
}
