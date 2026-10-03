import Link from "next/link";
import { Gift } from "lucide-react";
import { HomeSection, Media, safeHref, type Tone } from "./Section";

export type Budget = { amount?: number; hint?: string; link?: string };
// Same pastel family as the occasion cards and age icons.
const TAGS = [
  { bg: "bg-blush", fg: "text-action", tilt: "-rotate-[4deg]" },
  { bg: "bg-butter", fg: "text-navy", tilt: "rotate-[3deg]" },
  { bg: "bg-sky", fg: "text-doodle", tilt: "-rotate-[2deg]" },
  { bg: "bg-blush", fg: "text-navy", tilt: "rotate-[2deg]" },
];

/** Line-art gift box shown until a photo is uploaded (same style as the age icons). */
function GiftArt() {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 120 120" className="h-[46%] w-[46%] text-navy" aria-hidden="true">
      <rect x="24" y="52" width="72" height="50" rx="6" fill="#FCD325" />
      <rect {...s} x="24" y="52" width="72" height="50" rx="6" />
      <rect x="18" y="38" width="84" height="16" rx="5" fill="#fff" />
      <rect {...s} x="18" y="38" width="84" height="16" rx="5" />
      <path d="M53 38H67V102H53Z" fill="#F6A49A" />
      <path {...s} d="M53 38V102M67 38V102" />
      <path {...s} d="M60 38C52 26 38 24 38 32C38 38 50 39 60 38ZM60 38C68 26 82 24 82 32C82 38 70 39 60 38Z" />
      <path {...s} d="M14 22l3 3M106 20l-3 3M96 10v5M24 10v5" />
    </svg>
  );
}

/**
 * Gift corner: a photo (or a drawn gift box), the headline, and budget
 * "gift tags" hanging from a twine — tap a tag to see gifts under that price.
 */
export default function GiftCorner({
  title,
  subtitle,
  config,
  tone,
}: {
  title?: string | null;
  subtitle?: string | null;
  config?: { eyebrow?: string; cta_text?: string; cta_link?: string; budgets?: Budget[]; image?: string; badge?: string };
  tone?: Tone;
}) {
  const budgets = (config?.budgets ?? []).filter((b) => Number(b?.amount) > 0).slice(0, 4);
  const badge = config?.badge ?? "Free gift wrap + a handwritten note";
  return (
    <HomeSection tone={tone} testid="gift-corner">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr] md:gap-14">
        <div className="relative">
          <div className="relative grid aspect-[16/11] md:aspect-[5/4] place-items-center overflow-hidden rounded-[26px] bg-butter">
            {config?.image ? (
              <Media src={config.image} alt={title || "Gift ideas"} className="absolute inset-0 h-full w-full" sizes="(min-width:768px) 45vw, 100vw" />
            ) : (
              <GiftArt />
            )}
          </div>
          {badge && (
            <span className="absolute -bottom-4 left-4 right-4 md:left-6 md:right-auto flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-premium">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush text-action">
                <Gift className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-hand text-[17px] leading-tight text-navy">{badge}</span>
            </span>
          )}
        </div>

        <div className="pt-4 md:pt-0">
          <div className="sh grid gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B]">{config?.eyebrow || "Gift corner"}</p>
            <h2 className="font-display text-[28px] md:text-4xl lg:text-[40px] leading-[1.1] text-navy text-balance">{title || "Birthday coming up?"}</h2>
            <p className="text-muted leading-relaxed max-w-md">{subtitle || "Pick a budget and we'll show gifts kids love."}</p>
          </div>

          {budgets.length > 0 && (
            <div className="relative mt-6">
              {/* the twine the tags hang from */}
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-5 w-full" aria-hidden="true">
                <path d="M0 4Q75 18 150 10T300 6" fill="none" stroke="#C9A66B" strokeWidth="1.5" strokeDasharray="1 3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              <ul className={`stagger relative grid gap-3 md:gap-4 ${budgets.length === 4 ? "grid-cols-4" : budgets.length === 2 ? "grid-cols-2" : budgets.length === 1 ? "grid-cols-1 max-w-[180px]" : "grid-cols-3"}`}>
                {budgets.map((b, i) => {
                  const t = TAGS[i % TAGS.length];
                  return (
                    <li key={i} className="flex flex-col items-center">
                      <span className="h-5 w-px bg-[#C9A66B]" aria-hidden="true" />
                      <Link
                        href={safeHref(b.link, `/shop?max=${Number(b.amount)}`)}
                        className={`group relative w-full origin-top ${t.tilt} transition-transform duration-500 ease-premium hover:rotate-0 hover:-translate-y-1 focus-visible:rotate-0 drop-shadow-[0_10px_14px_rgba(53,66,117,0.14)]`}
                      >
                        <span
                          className={`flex flex-col items-center gap-1 px-2 pb-5 pt-8 text-center ${t.bg}`}
                          style={{ clipPath: "polygon(22% 0, 78% 0, 100% 16%, 100% 100%, 0 100%, 0 16%)", borderRadius: "0 0 18px 18px" }}
                        >
                          <span className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-white ring-2 ring-[#C9A66B]/60" aria-hidden="true" />
                          <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-[0.12em] text-muted">Under</span>
                          <span className={`font-display text-[22px] sm:text-3xl md:text-[34px] leading-none ${t.fg}`}>₹{Number(b.amount).toLocaleString("en-IN")}</span>
                          {b.hint && <span className="text-[11px] md:text-sm leading-tight text-ink/70">{b.hint}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <Link href={safeHref(config?.cta_link, "/category/gift-hampers")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-navy hover:bg-ink text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
            <Gift className="w-4 h-4" aria-hidden="true" /> {config?.cta_text || "See gift hampers"}
          </Link>
        </div>
      </div>
    </HomeSection>
  );
}
