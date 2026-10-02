import Link from "next/link";
import type { AgeGroup } from "@/lib/types";
import { HomeSection, SectionHeader, type Tone } from "./Section";

const TONES = [
  { bg: "bg-blush", fg: "text-action" },
  { bg: "bg-butter", fg: "text-warning" },
  { bg: "bg-sky", fg: "text-doodle" },
];

/** "0-12 Months" → "0–12", "10+ Years" → "10+" for the big round badge. */
function badge(label: string) {
  const m = label.match(/^(\d+\s*[-–+]\s*\d*)/);
  return (m ? m[1] : label.slice(0, 4)).replace(/\s+/g, "").replace("-", "–");
}

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
      <SectionHeader eyebrow={config?.eyebrow || "Find the right fit"} title={title || "Shop by age"} subtitle={subtitle} href={config?.link || "/legal/shipping"} linkText={config?.link_text || "Size guide"} />
      <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        {ages.map((a, i) => {
          const t = TONES[i % TONES.length];
          return (
            <li key={a.id}>
              <Link
                href={`/shop?age=${encodeURIComponent(a.slug)}`}
                className="group h-full flex flex-col items-center gap-2.5 rounded-[22px] bg-white border border-line px-2 py-5 text-center transition-all hover:-translate-y-1 hover:shadow-premium"
              >
                <span className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center font-display font-bold text-lg md:text-xl ${t.bg} ${t.fg}`}>{badge(a.label)}</span>
                <span className="text-sm md:text-[15px] font-extrabold text-navy leading-tight">{a.label}</span>
                {config?.hints?.[a.slug] && <span className="text-xs text-muted leading-tight">{config.hints[a.slug]}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
