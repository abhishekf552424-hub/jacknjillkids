"use client";

import { useRef } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { normalizeEmbedUrl } from "@/lib/embeds";

type Video = { url: string; name?: string; caption?: string; autoplay?: boolean };

export default function ParentsReviews({
  title,
  subtitle,
  videos,
}: {
  title?: string | null;
  subtitle?: string | null;
  videos?: Video[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const list: Video[] = videos?.length
    ? videos
    : [
        { name: "Priya S.", caption: "Amazing quality, lasted us 2 years!", url: "" },
        { name: "Rahul M.", caption: "Fastest delivery in Kolhapur.", url: "" },
        { name: "Anita P.", caption: "Skin-safe fabrics — no rashes!", url: "" },
      ];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 400; // approximate card width + gap
    const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="bg-blush py-16 md:py-20" data-testid="parents-reviews">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Testimonials</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">{title ?? "Real Parents, Real Stories"}</h2>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
        
        <div className="relative">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all duration-200 -translate-x-1/2"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg hover:shadow-xl flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-all duration-200 translate-x-1/2"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 px-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {list.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[85%] sm:min-w-[360px] max-w-[400px] snap-start bg-white rounded-lg shadow-soft border border-navy/5 overflow-hidden hover:shadow-premium hover:-translate-y-1 transition-all duration-300 flex-shrink-0"
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
