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
  // Phase O — per-slide style controls
  overlay_opacity?: number;      // 0-100 (%), default 20
  overlay_color?: string;        // any CSS color, default "#0a1e3f" (navy)
  heading_color?: string;        // any CSS color, default "#ffffff"
  heading_size?: "sm" | "md" | "lg"; // preset scale, default "lg"
  cta_style?: "gradient" | "outline" | "navy"; // default "gradient"
  content_position?: "left" | "center" | "right"; // default "left"
};

const HEADING_SIZE_CLASSES: Record<string, string> = {
  sm: "text-2xl sm:text-3xl lg:text-4xl",
  md: "text-3xl sm:text-4xl lg:text-5xl",
  lg: "text-3xl sm:text-4xl lg:text-6xl",
};

const CONTENT_POS_CLASSES: Record<string, string> = {
  left: "md:w-2/3 lg:w-1/2 md:mr-auto text-left",
  center: "md:w-4/5 lg:w-3/4 mx-auto text-center",
  right: "md:w-2/3 lg:w-1/2 md:ml-auto text-right",
};

function CtaButton({ style, text, link }: { style: string; text: string; link: string }) {
  const base = "inline-flex items-center gap-2 font-bold rounded-full px-6 py-3 md:px-8 md:py-4 hover:-translate-y-0.5 transition-transform";
  if (style === "outline") {
    return (
      <Link href={link} data-testid="hero-cta" className={`${base} border-2 border-white text-white hover:bg-white hover:text-navy`}>
        {text} <ChevronRight className="w-4 h-4" />
      </Link>
    );
  }
  if (style === "navy") {
    return (
      <Link href={link} data-testid="hero-cta" className={`${base} bg-navy text-white shadow-premium`}>
        {text} <ChevronRight className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <Link href={link} data-testid="hero-cta" className={`${base} bg-brand-gradient text-white shadow-premium`}>
      {text} <ChevronRight className="w-4 h-4" />
    </Link>
  );
}

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
  const overlayOpacity = typeof s.overlay_opacity === "number" ? Math.max(0, Math.min(100, s.overlay_opacity)) : 20;
  const overlayColor = s.overlay_color || "#0a1e3f";
  const headingColor = s.heading_color || "#ffffff";
  const headingSizeCls = HEADING_SIZE_CLASSES[s.heading_size || "lg"];
  const posCls = CONTENT_POS_CLASSES[s.content_position || "left"];

  return (
    <section className="relative overflow-hidden bg-cream" data-testid="hero-carousel">
      <div className="relative container py-4 md:py-8">
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
              {/* Per-slide flat overlay — 0% opacity renders NO overlay at all */}
              {overlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full flex items-end md:items-center">
            <div className={`w-full p-5 sm:p-8 md:p-14 ${posCls}`} style={{ color: headingColor }}>
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
                className={`font-display leading-[1.05] tracking-tight ${headingSizeCls}`}
                style={{ color: headingColor }}
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
                  <CtaButton style={s.cta_style || "gradient"} text={s.cta_text!} link={s.cta_link!} />
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
