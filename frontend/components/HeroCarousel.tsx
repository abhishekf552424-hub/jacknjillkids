"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVimeoBackgroundUrl } from "@/lib/embeds";

type Slide = {
  image?: string;
  video_url?: string;
  heading?: string;
  subheading?: string;
  cta_text?: string;
  cta_link?: string;
};

export default function HeroCarousel({ slides, title, subtitle }: { slides: Slide[]; title?: string | null; subtitle?: string | null }) {
  const [i, setI] = useState(0);
  const list: Slide[] = slides.length ? slides : [{
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600",
    heading: title ?? "Tiny Steps, Big Smiles",
    subheading: subtitle ?? "Style • Comfort • Care",
    cta_text: "Shop New Arrivals",
    cta_link: "/shop?sort=newest",
  }];

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  const s = list[i];
  const bgVideo = s.video_url ? getVimeoBackgroundUrl(s.video_url) : null;
  const hasCta = Boolean(s.cta_text && s.cta_link && s.cta_text.trim() && s.cta_link.trim());

  return (
    <section className="relative overflow-hidden bg-cream" data-testid="hero-carousel">
      <div className="relative container py-4 md:py-8">
        {/* Fixed horizontal aspect-ratio on ALL breakpoints — never switches to portrait */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[720px] rounded-lg overflow-hidden bg-navy">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {bgVideo ? (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {/* Chromeless Vimeo background player, scaled to cover */}
                  <iframe
                    src={bgVideo}
                    title={s.heading || "Hero video"}
                    frameBorder={0}
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
                  />
                </div>
              ) : s.image ? (
                <Image
                  src={s.image}
                  alt={s.heading || "Hero"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-navy/70 md:from-navy/60 via-navy/30 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full flex items-end md:items-center">
            <div className="w-full md:w-2/3 lg:w-1/2 p-5 sm:p-8 md:p-14 text-white">
              <motion.p
                key={`sub-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="uppercase tracking-[0.3em] text-gold text-[10px] sm:text-xs font-bold mb-3"
              >
                {s.subheading ?? "Since 2003 • Kolhapur"}
              </motion.p>
              <motion.h1
                key={`h-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-3xl sm:text-4xl lg:text-6xl leading-[1.05] tracking-tight"
              >
                {s.heading ?? "Tiny Steps, Big Smiles"}
              </motion.h1>
              {hasCta && (
                <motion.div
                  key={`c-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-6 md:mt-8"
                >
                  <Link
                    href={s.cta_link!}
                    data-testid="hero-cta"
                    className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold rounded-full px-6 py-3 md:px-8 md:py-4 shadow-premium hover:-translate-y-0.5 transition-transform"
                  >
                    {s.cta_text}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </div>
          </div>

          {list.length > 1 && (
            <>
              <button
                onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-navy shadow-soft"
                aria-label="Previous slide"
                data-testid="hero-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setI((v) => (v + 1) % list.length)}
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-navy shadow-soft"
                aria-label="Next slide"
                data-testid="hero-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {list.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setI(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-1.5 bg-white/50"}`}
                    data-testid={`hero-dot-${idx}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
