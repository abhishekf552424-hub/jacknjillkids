import * as Icons from "lucide-react";
import Image from "next/image";
import type { TrustBadge } from "@/lib/types";

/** Trust badges: one white card, icons in soft sky circles (approved mockup). */
export default function TrustStrip({ badges }: { badges: TrustBadge[] }) {
  if (!badges || badges.length === 0) return null;
  const imageBadges = badges.filter((b) => (b.icon_type || "lucide") === "image" && b.icon_url);
  const iconBadges = badges.filter((b) => !((b.icon_type || "lucide") === "image" && b.icon_url));
  return (
    <section className="container py-8 md:py-12" data-testid="trust-strip">
      {iconBadges.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {iconBadges.map((b) => {
            const Icon = (Icons as any)[b.icon || "Award"] ?? Icons.Award;
            return (
              <div key={b.id} className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-sky text-doodle flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-[18px] font-extrabold text-ink">{b.label}</span>
                  {b.subtext && <span className="block text-xs leading-4 text-muted mt-0.5">{b.subtext}</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {imageBadges.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-center">
          {imageBadges.map((b) => (
            <div key={b.id} className="relative w-full aspect-square max-w-[180px] mx-auto">
              <Image src={b.icon_url!} alt={b.label} fill sizes="(min-width:768px) 180px, 45vw" className="object-contain" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
