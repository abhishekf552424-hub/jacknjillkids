import Link from "next/link";
import type { AgeGroup } from "@/lib/types";

const TINTS = ["bg-sky", "bg-butter", "bg-blush"];

/** "Shop by age" — round bubbles, the way parents actually shop for kids. */
export default function AgeBubbles({ ageGroups, title, subtitle }: { ageGroups: AgeGroup[]; title?: string | null; subtitle?: string | null }) {
  if (!ageGroups.length) return null;
  // "0-12 Months" -> "0–12" big, "months" small; "10+ Years" -> "10+", "years"
  const split = (label: string) => {
    const m = label.match(/^\s*([\d+\s–-]+?)\s*(months?|mths?|years?|yrs?)\s*$/i);
    return m ? { big: m[1].replace(/\s*-\s*/g, "–").trim(), small: m[2].toLowerCase() } : { big: label, small: "" };
  };
  return (
    <section id="shop-by-age" className="py-8 md:py-12 scroll-mt-24" data-testid="age-bubbles">
      <div className="container flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl leading-8 md:text-4xl md:leading-tight text-navy">{title || "Shop by age"}</h2>
        <Link href="/shop" className="shrink-0 text-sm font-bold text-doodle hover:text-ink hover:underline underline-offset-4">See all</Link>
      </div>
      {subtitle && <p className="container mt-1 text-muted">{subtitle}</p>}
      <ul className="mt-5 container flex md:flex-wrap md:justify-start gap-3 md:gap-5 overflow-x-auto no-scrollbar pb-2">
        {ageGroups.map((a, idx) => {
          const { big, small } = split(a.label);
          return (
            <li key={a.id} className="shrink-0">
              <Link href={`/shop?age=${a.slug}`} className="group flex flex-col items-center gap-2 w-[76px] md:w-[96px]" data-testid={`age-${a.slug}`}>
                <span className={`w-[76px] h-[76px] md:w-[96px] md:h-[96px] rounded-full border-2 border-white shadow-soft flex items-center justify-center font-display text-lg md:text-2xl text-navy transition-transform group-hover:-translate-y-1 ${TINTS[idx % TINTS.length]}`}>
                  {big}
                </span>
                <span className="text-[13px] leading-4 font-bold text-ink text-center">{small ? `${big} ${small}` : a.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
