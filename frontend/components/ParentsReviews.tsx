"use client";

import { Play } from "lucide-react";
import { motion } from "framer-motion";

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
  const list: Video[] = videos?.length
    ? videos
    : [
        { name: "Priya S.", caption: "Amazing quality, lasted us 2 years!", url: "" },
        { name: "Rahul M.", caption: "Fastest delivery in Kolhapur.", url: "" },
        { name: "Anita P.", caption: "Skin-safe fabrics — no rashes!", url: "" },
      ];

  return (
    <section className="bg-blush py-16 md:py-20" data-testid="parents-reviews">
      <div className="container">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Testimonials</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">{title ?? "Real Parents, Real Stories"}</h2>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {list.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-lg shadow-soft border border-gold/20 overflow-hidden"
            >
              <div className="relative aspect-video bg-navy flex items-center justify-center">
                {v.url ? (
                  <iframe
                    src={v.url}
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
                <p className="text-navy font-medium">{v.name}</p>
                {v.caption && <p className="text-sm text-muted mt-1">"{v.caption}"</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
