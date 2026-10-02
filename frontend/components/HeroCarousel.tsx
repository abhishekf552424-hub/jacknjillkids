"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVimeoBackgroundUrl } from "@/lib/embeds";

type Slide = {
  image?: string;
  video_url?: string;
  heading?: string;
  subheading?: string;
  cta_text?: string;
  cta_link?: string;
  // Older per-slide style controls. The redesigned hero puts the words on the
  // cream page (not over the photo), so only cta_style is still used.
  overlay_opacity?: number;
  overlay_color?: string;
  heading_color?: string;
  heading_size?: "sm" | "md" | "lg";
  cta_style?: "gradient" | "outline" | "navy";
  content_position?: "left" | "center" | "right";
  border_radius?: "none" | "soft" | "rounded" | "pill";
};

/**
 * Homepage hero — layout from the approved mockup: a rounded photo card with
 * the logo's rising red→yellow arc along its foot, and the words on the cream
 * page beside it (below it on phones), so text stays readable on any photo.
 */
export default function HeroCarousel({ slides, title, subtitle }: { slides: Slide[]; title?: string | null; subtitle?: string | null }) {
  const [i, setI] = useState(0);
  const gradId = `rise-${useId().replace(/:/g, "")}`;

  // Only slides with a picture or video; an unfinished slide would show an empty card.
  const validSlides = slides.filter((sl) => Boolean(sl.image || sl.video_url));
  const list: Slide[] = validSlides.length
    ? validSlides
    : [
        {
          image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600",
          heading: title ?? "Little outfits for big adventures",
          subheading: "Since 2003 · Shahupuri, Kolhapur",
          cta_text: "Shop new arrivals",
          cta_link: "/shop?sort=newest",
        },
      ];

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  const s = list[i];
  const bgVideo = s.video_url ? getVimeoBackgroundUrl(s.video_url) : null;
  const hasCta = Boolean(s.cta_text?.trim() && s.cta_link?.trim());
  const primary =
    s.cta_style === "navy" || s.cta_style === "outline"
      ? "bg-navy hover:bg-ink text-white"
      : "bg-action hover:bg-action-hover text-white";

  return (
    <section className="bg-cream" data-testid="hero-carousel">
      <div className="container pt-4 pb-8 md:py-12 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        {/* Photo card */}
        <div className="relative md:order-2">
          <div className="relative w-full aspect-[4/3] md:aspect-[5/4] overflow-hidden rounded-[28px] bg-sky">
            <AnimatePresence>
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
                    <iframe
                      src={bgVideo}
                      title={s.heading || "Jack & Jill video"}
                      frameBorder={0}
                      allow="autoplay; fullscreen; picture-in-picture"
                      className="absolute top-1/2 left-1/2 w-[177.78%] h-[177.78%] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
                    />
                  </div>
                ) : s.image ? (
                  <Image src={s.image} alt={s.heading || "Kids in Jack & Jill outfits"} fill priority sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
                ) : null}
              </motion.div>
            </AnimatePresence>

            {/* The logo's rising arrows, drawn as a hill along the card's foot */}
            <svg viewBox="0 0 400 64" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px w-full h-12 md:h-16" aria-hidden="true">
              <defs>
                <linearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#EA4137" />
                  <stop offset="0.5" stopColor="#F38838" />
                  <stop offset="1" stopColor="#FCD325" />
                </linearGradient>
              </defs>
              <path d="M0 64 C 110 64, 180 28, 400 6 L 400 64 Z" fill="#FFF8EC" />
              <path d="M0 58 C 110 58, 180 22, 400 2" fill="none" stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>

            {list.length > 1 && (
              <>
                <button
                  onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
                  className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/90 hover:bg-white text-navy shadow-soft"
                  aria-label="Previous slide"
                  data-testid="hero-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setI((v) => (v + 1) % list.length)}
                  className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/90 hover:bg-white text-navy shadow-soft"
                  aria-label="Next slide"
                  data-testid="hero-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {list.length > 1 && (
            <div className="mt-3 flex justify-center gap-2">
              {list.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === i}
                  className="p-2 -m-1"
                  data-testid={`hero-dot-${idx}`}
                >
                  <span className={`block h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-navy" : "w-1.5 bg-line-strong"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Words on the page */}
        <div className="md:order-1">
          <motion.p
            key={`sub-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-xs font-extrabold uppercase tracking-[0.12em] text-gold-text"
          >
            {s.subheading || "Since 2003 · Shahupuri, Kolhapur"}
          </motion.p>
          <motion.h1
            key={`h-${i}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
            className="mt-3 font-hero text-navy text-[36px] leading-[40px] sm:text-5xl sm:leading-[1.05] lg:text-6xl"
          >
            {s.heading || title || "Little outfits for big adventures"}
          </motion.h1>
          {subtitle && <p className="mt-4 text-base md:text-lg leading-relaxed text-ink max-w-xl">{subtitle}</p>}
          <div className="mt-6 flex gap-3">
            {hasCta && (
              <Link href={s.cta_link!} data-testid="hero-cta" className={`flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-2 h-[52px] px-5 sm:px-7 rounded-full font-extrabold text-[15px] transition-colors ${primary}`}>
                <span className="truncate">{s.cta_text}</span> <ChevronRight className="hidden sm:block w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>
            )}
            <Link href="#shop-by-age" className="shrink-0 inline-flex items-center justify-center h-[52px] px-5 sm:px-6 rounded-full border-2 border-navy text-navy font-extrabold text-[15px] hover:bg-navy hover:text-white transition-colors">
              Shop by age
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
