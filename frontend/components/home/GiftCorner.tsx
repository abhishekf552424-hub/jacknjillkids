import Link from "next/link";
import { Gift } from "lucide-react";
import { HomeSection, safeHref, type Tone } from "./Section";

export type Budget = { amount?: number; hint?: string; link?: string };
const COLORS = ["text-action", "text-navy", "text-success", "text-doodle"];

export default function GiftCorner({
  title,
  subtitle,
  config,
  tone,
}: {
  title?: string | null;
  subtitle?: string | null;
  config?: { eyebrow?: string; cta_text?: string; cta_link?: string; budgets?: Budget[] };
  tone?: Tone;
}) {
  const budgets = (config?.budgets ?? []).filter((b) => Number(b?.amount) > 0).slice(0, 4);
  return (
    <HomeSection tone={tone} testid="gift-corner">
      <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-[26px] bg-blush p-7 md:p-9 flex flex-col justify-between gap-6">
          <div className="grid gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B]">{config?.eyebrow || "Gift corner"}</p>
            <h2 className="font-display text-[28px] md:text-4xl leading-[1.1] text-navy text-balance">{title || "Birthday coming up?"}</h2>
            <p className="text-muted leading-relaxed max-w-sm">{subtitle || "Pick a budget and we'll show gifts kids love. Free gift wrap with a handwritten note."}</p>
          </div>
          <Link href={safeHref(config?.cta_link, "/category/gift-hampers")} className="self-start inline-flex items-center gap-2 rounded-full bg-navy hover:bg-ink text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
            <Gift className="w-4 h-4" aria-hidden="true" /> {config?.cta_text || "See gift hampers"}
          </Link>
        </div>
        {budgets.length > 0 && (
          <ul className={`grid gap-3 md:gap-4 grid-cols-2 ${budgets.length >= 3 ? "sm:grid-cols-3" : ""} ${budgets.length === 4 ? "lg:grid-cols-4" : ""}`}>
            {budgets.map((b, i) => (
              <li key={i}>
                <Link
                  href={safeHref(b.link, `/shop?max=${Number(b.amount)}`)}
                  className="h-full min-h-[150px] flex flex-col items-center justify-center gap-1.5 rounded-[22px] bg-white border border-line px-4 py-6 text-center transition-all hover:-translate-y-1 hover:shadow-premium"
                >
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted">Under</span>
                  <span className={`font-display font-bold text-3xl md:text-[40px] leading-none ${COLORS[i % COLORS.length]}`}>₹{Number(b.amount).toLocaleString("en-IN")}</span>
                  {b.hint && <span className="text-sm text-muted">{b.hint}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HomeSection>
  );
}
