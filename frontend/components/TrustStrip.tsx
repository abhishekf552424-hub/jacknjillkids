import * as Icons from "lucide-react";
import Image from "next/image";
import type { TrustBadge } from "@/lib/types";

export default function TrustStrip({ badges }: { badges: TrustBadge[] }) {
  // Phase S — render nothing (not even an empty section title) when no badges exist.
  if (!badges || badges.length === 0) return null;
  return (
    <section className="container py-16 md:py-20" data-testid="trust-strip">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center">
        {badges.map((b) => {
          const iconType = b.icon_type || "lucide";
          if (iconType === "image" && b.icon_url) {
            // New style: the badge graphic already has its heading/subtext
            // baked in (3D icon + text) — show it clean and full-size, no
            // card border/background/shadow, no duplicated text.
            return (
              <div key={b.id} className="relative w-full aspect-square max-w-[180px] mx-auto">
                <Image src={b.icon_url} alt={b.label} fill sizes="(min-width:768px) 180px, 45vw" className="object-contain" />
              </div>
            );
          }
          const Icon = (Icons as any)[b.icon || "Award"] ?? Icons.Award;
          return (
            <div key={b.id} className="flex items-start gap-3 bg-white rounded p-4 shadow-soft border border-navy/5">
              <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">{b.label}</p>
                {b.subtext && <p className="text-xs text-muted mt-0.5">{b.subtext}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
