import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Rail from "@/components/Rail";
import { HomeSection, SectionHeader, Media, safeHref, type Tone } from "./Section";

export type OccasionCard = { title?: string; subtitle?: string; image?: string; link?: string };
// Card colours match the photo backdrops (blush / butter / sky), so photo and card read as one.
const CARD_BG = ["bg-blush", "bg-butter", "bg-sky"];

/**
 * "Dressed for every occasion": the photo sits in its own portrait frame
 * (nothing covers it, faces are kept by focusing on the top), the name and
 * link sit underneath. Swipeable carousel on phones, three across on desktop.
 */
export default function Occasions({ title, subtitle, config, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; cards?: OccasionCard[] }; tone?: Tone }) {
  const cards = (config?.cards ?? []).filter((c) => c?.title).slice(0, 3);
  if (!cards.length) return null;
  return (
    <HomeSection tone={tone} testid="occasions">
      <SectionHeader eyebrow={config?.eyebrow || "Collections"} title={title || "Dressed for every occasion"} subtitle={subtitle} />
      <Rail label={title || "Dressed for every occasion"} itemClassName="w-[78%] sm:w-[46%] md:w-[31.8%]" gapClassName="gap-4 md:gap-5">
        {cards.map((c, i) => (
          <Link
            key={i}
            href={safeHref(c.link)}
            className={`group flex h-full flex-col rounded-[26px] p-2.5 md:p-3 transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-premium ${CARD_BG[i % 3]}`}
          >
            <span className="relative block aspect-[4/5] overflow-hidden rounded-[20px] bg-white/50">
              {c.image && (
                <Media
                  src={c.image}
                  alt={c.title || ""}
                  className="absolute inset-0 h-full w-full object-[50%_20%] transition-transform duration-1000 ease-premium group-hover:scale-[1.06]"
                  sizes="(min-width:768px) 32vw, 78vw"
                />
              )}
            </span>
            <span className="grid gap-1 px-2.5 pb-2 pt-4 md:px-3">
              <span className="font-display text-xl md:text-2xl text-navy">{c.title}</span>
              {c.subtitle && <span className="text-sm text-muted">{c.subtitle}</span>}
              <span className="mt-1.5 inline-flex items-center gap-1 text-sm font-extrabold text-action">
                Shop now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </span>
          </Link>
        ))}
      </Rail>
    </HomeSection>
  );
}
