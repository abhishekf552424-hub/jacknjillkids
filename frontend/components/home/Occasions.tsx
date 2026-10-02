import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSection, SectionHeader, Media, safeHref, type Tone } from "./Section";

export type OccasionCard = { title?: string; subtitle?: string; image?: string; link?: string };
const FALLBACK_BG = ["bg-blush", "bg-butter", "bg-sky"];

export default function Occasions({ title, subtitle, config, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; cards?: OccasionCard[] }; tone?: Tone }) {
  const cards = (config?.cards ?? []).filter((c) => c?.title).slice(0, 3);
  if (!cards.length) return null;
  return (
    <HomeSection tone={tone} testid="occasions">
      <SectionHeader eyebrow={config?.eyebrow || "Collections"} title={title || "Dressed for every occasion"} subtitle={subtitle} />
      <div className={`grid gap-4 md:gap-5 ${cards.length === 1 ? "" : cards.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {cards.map((c, i) => (
          <Link
            key={i}
            href={safeHref(c.link)}
            className={`group relative isolate flex min-h-[340px] md:min-h-[440px] items-end overflow-hidden rounded-[26px] ${c.image ? "" : FALLBACK_BG[i % 3]}`}
          >
            {c.image && <Media src={c.image} alt={c.title || ""} className="absolute inset-0 -z-10 h-full w-full transition-transform duration-700 group-hover:scale-105" sizes="(min-width:768px) 33vw, 100vw" />}
            <span className="m-3 md:m-4 w-full rounded-[18px] bg-white/95 backdrop-blur px-5 py-4 grid gap-1">
              <span className="font-display text-xl md:text-2xl text-navy">{c.title}</span>
              {c.subtitle && <span className="text-sm text-muted">{c.subtitle}</span>}
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-extrabold text-action">
                Shop now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </HomeSection>
  );
}
