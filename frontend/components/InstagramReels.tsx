"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Instagram, Heart } from "lucide-react";

const DEFAULTS = [
  "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600",
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600",
  "https://images.unsplash.com/photo-1584727638096-042c45049ebe?w=600",
  "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600",
  "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=600",
  "https://images.unsplash.com/photo-1524183551017-8ca23bb63e8f?w=600",
];

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
  const items = urls?.length ? urls : DEFAULTS;
  return (
    <section className="container py-16 md:py-20" data-testid="instagram-reels">
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
        >
          <Instagram className="w-4 h-4" /> @jacknjill_kolhapur
        </a>
      </div>
      <div ref={scroll} className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((u, i) => (
          <motion.a
            key={i}
            href="https://instagram.com/jacknjill_kolhapur"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -4 }}
            className="relative min-w-[70%] sm:min-w-[280px] aspect-[9/16] rounded-lg overflow-hidden snap-start shadow-soft group"
          >
            <img src={u} alt={`Reel ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Watch</span>
              <Instagram className="w-4 h-4" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
