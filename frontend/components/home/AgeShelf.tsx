import Link from "next/link";
import type { AgeGroup } from "@/lib/types";
import Rail from "@/components/Rail";
import AgeIcon from "./AgeIcons";
import { HomeSection, SectionHeader, safeHref, type Tone } from "./Section";

// Soft circle behind each icon + the one brand colour used inside the drawing.
const TONES = [
  { bg: "bg-blush", accent: "#F6A49A" },
  { bg: "bg-butter", accent: "#FCD325" },
  { bg: "bg-sky", accent: "#A9C0EA" },
];

export default function AgeShelf({
  ages,
  title,
  subtitle,
  config,
  tone,
}: {
  ages: AgeGroup[];
  title?: string | null;
  subtitle?: string | null;
  config?: { eyebrow?: string; hints?: Record<string, string>; link_text?: string; link?: string };
  tone?: Tone;
}) {
  if (!ages.length) return null;
  return (
    <HomeSection tone={tone} testid="age-shelf">
      <SectionHeader eyebrow={config?.eyebrow || "Find the right fit"} title={title || "Shop by age"} subtitle={subtitle} href={safeHref(config?.link, "/faq")} linkText={config?.link_text || "Size help"} />
      <Rail label={title || "Shop by age"} itemClassName="w-[40%] sm:w-[27%] md:w-[21%] lg:w-[15.6%]">
        {ages.map((a, i) => {
          const t = TONES[i % TONES.length];
          return (
            <Link
              key={a.id}
              href={`/shop?age=${encodeURIComponent(a.slug)}`}
              className="group h-full flex flex-col items-center gap-2.5 rounded-[22px] bg-white border border-line px-2 py-6 text-center transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-premium hover:border-transparent active:scale-[0.97]"
            >
              <span
                className={`w-[68px] h-[68px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center text-navy transition-transform duration-500 ease-premium group-hover:scale-110 group-hover:-rotate-6 ${t.bg}`}
              >
                <AgeIcon slug={a.slug} index={i} accent={t.accent} className="w-12 h-12 md:w-14 md:h-14" />
              </span>
              <span className="text-sm md:text-[15px] font-extrabold text-navy leading-tight">{a.label}</span>
              {config?.hints?.[a.slug] && <span className="text-xs text-muted leading-tight">{config.hints[a.slug]}</span>}
            </Link>
          );
        })}
      </Rail>
    </HomeSection>
  );
}
