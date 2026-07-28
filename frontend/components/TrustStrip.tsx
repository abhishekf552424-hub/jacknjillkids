import * as Icons from "lucide-react";
import Image from "next/image";
import type { TrustBadge } from "@/lib/types";

export default function TrustStrip({ badges }: { badges: TrustBadge[] }) {
  return (
    <section className="container py-16 md:py-20" data-testid="trust-strip">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {badges.map((b) => {
          const iconType = b.icon_type || "lucide";
          const Icon = iconType === "lucide" ? ((Icons as any)[b.icon || "Award"] ?? Icons.Award) : null;
          return (
            <div key={b.id} className="flex items-start gap-3 bg-white rounded p-4 shadow-soft border border-navy/5">
              <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0 overflow-hidden">
                {iconType === "image" && b.icon_url ? (
                  <Image src={b.icon_url} alt="" width={40} height={40} className="w-full h-full object-contain p-1" />
                ) : Icon ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <Icons.Award className="w-5 h-5" />
                )}
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
