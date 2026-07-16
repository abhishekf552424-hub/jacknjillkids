"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  image: string;
  heading?: string;
  subheading?: string;
  cta_text?: string;
  cta_link?: string;
};

export default function HeroCarousel({ slides, title, subtitle }: { slides: Slide[]; title?: string | null; subtitle?: string | null }) {
  const [i, setI] = useState(0);
  const list = slides.length ? slides : [{
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

  return (
    <section className="relative overflow-hidden bg-cream" data-testid="hero-carousel">
      <div className="relative container py-6 md:py-10">
        <div className="relative w-full h-[70vh] md:h-[78vh] rounded-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={s.image}
                alt={s.heading || "Hero"}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-navy/70 md:from-navy/60 via-navy/30 to-transparent grain" />
            </motion.div>
          </AnimatePresence>

          <div className="relative h-full flex items-end md:items-center">
            <div className="w-full md:w-2/3 lg:w-1/2 p-6 md:p-14 text-white">
              <motion.p
                key={`sub-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-tiny uppercase tracking-[0.3em] text-gold text-xs font-bold mb-4"
              >
                {s.subheading ?? "Since 2003 • Kolhapur"}
              </motion.p>
              <motion.h1
                key={`h-${i}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight"
              >
                {s.heading ?? "Tiny Steps,\nBig Smiles"}
              </motion.h1>
              <motion.div
                key={`c-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-8"
              >
                <Link
                  href={s.cta_link ?? "/shop"}
                  data-testid="hero-cta"
                  className="inline-flex items-center gap-2 bg-brand-gradient text-white font-bold rounded px-8 py-4 shadow-premium hover:-translate-y-0.5 transition-transform"
                >
                  {s.cta_text ?? "Shop the Collection"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>

          {list.length > 1 && (
            <>
              <button
                onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-navy shadow-soft"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setI((v) => (v + 1) % list.length)}
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/80 hover:bg-white text-navy shadow-soft"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {list.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setI(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-white" : "w-1.5 bg-white/50"}`}
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
