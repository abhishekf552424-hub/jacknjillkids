"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Instagram } from "lucide-react";
import { isInstagramPermalink } from "@/lib/embeds";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function InstagramReels({
  title,
  subtitle,
  urls,
}: {
  title?: string | null;
  subtitle?: string | null;
  urls?: string[];
}) {
  const scroll = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [loadScript, setLoadScript] = useState(false);
  const items = (urls ?? []).filter((u) => isInstagramPermalink(u));

  // Only load the Instagram embed script once this section scrolls into view.
  useEffect(() => {
    if (!sectionRef.current || items.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setLoadScript(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(sectionRef.current);
    return () => io.disconnect();
  }, [items.length]);

  // Re-process embeds whenever URLs change or the script has already loaded.
  useEffect(() => {
    if (loadScript && typeof window !== "undefined" && window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
    }
  }, [urls, loadScript]);

  return (
    <section ref={sectionRef} className="container py-16 md:py-20" data-testid="instagram-reels">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Instagram</p>
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
          No Instagram reels added yet.
        </div>
      ) : (
        <div
          ref={scroll}
          className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
          data-testid="instagram-reels-scroll"
        >
          {items.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className="min-w-[85%] sm:min-w-[360px] max-w-[420px] snap-start"
              data-testid={`instagram-reel-${i}`}
            >
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={u}
                data-instgrm-version="14"
                style={{
                  background: "#FFF",
                  border: 0,
                  borderRadius: 8,
                  boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
                  margin: 0,
                  padding: 0,
                  width: "100%",
                }}
              >
                <a href={u} target="_blank" rel="noreferrer">View on Instagram</a>
              </blockquote>
            </div>
          ))}
        </div>
      )}

      {loadScript && (
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
          onLoad={() => {
            if (typeof window !== "undefined" && window.instgrm?.Embeds) {
              window.instgrm.Embeds.process();
            }
          }}
        />
      )}
    </section>
  );
}
