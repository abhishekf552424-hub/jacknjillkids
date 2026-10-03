import Link from "next/link";
import { normalizeEmbedUrl } from "@/lib/embeds";
import { HomeSection, Media, type Tone } from "./home/Section";

export type Stat = { value?: string; label?: string };
export type StoryConfig = {
  image?: string;
  video?: string;
  embed_url?: string;
  body?: string;
  /** Small second photo shown as a tilted polaroid (e.g. the shop front). */
  image2?: string;
  image2_caption?: string;
  /** Optional words from the founder/team — shown only when filled in. */
  quote?: string;
  quote_by?: string;
  stats?: Stat[];
  stamp_text?: string;
};

const DEFAULT_STATS: Stat[] = [
  { value: "2003", label: "Serving Kolhapur since" },
  { value: "10,000+", label: "Happy families" },
  { value: "0–14", label: "Years — every age" },
];

/** Round "since" stamp that slowly turns, drawn with SVG text on a circle. */
function Stamp({ text }: { text: string }) {
  // One loop of the text, stretched to fit the circle exactly.
  const label = `${text} · `;
  return (
    <span className="absolute -top-6 -left-2 md:-top-8 md:-left-8 z-10 grid h-24 w-24 md:h-[112px] md:w-[112px] place-items-center rounded-full bg-brand-yellow shadow-premium" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-[spin_22s_linear_infinite] motion-reduce:animate-none">
        <defs>
          <path id="jj-stamp-circle" d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1 -72 0" />
        </defs>
        <text className="fill-navy" style={{ fontSize: 10, fontWeight: 800 }}>
          <textPath href="#jj-stamp-circle" textLength="222" lengthAdjust="spacing">{label.toUpperCase()}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 24 24" className="h-7 w-7 md:h-8 md:w-8 text-action" fill="currentColor">
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
    </span>
  );
}

export default function BrandStory({
  title,
  subtitle,
  image,
  video,
  embed_url,
  body,
  tone = "cream",
  config = {},
}: {
  body?: string;
  tone?: Tone;
  title?: string | null;
  subtitle?: string | null;
  image?: string;
  video?: string;
  embed_url?: string;
  config?: StoryConfig;
}) {
  const embed = embed_url || config.embed_url;
  const vid = video || config.video;
  const img = image || config.image;
  const text = body || config.body;
  const stats = (config.stats?.length ? config.stats : DEFAULT_STATS).filter((s) => s?.value).slice(0, 3);

  return (
    <HomeSection tone={tone} testid="brand-story">
      <div className="grid items-center gap-14 md:grid-cols-[1.05fr_1fr] md:gap-16">
        {/* Photo with a turning "since" stamp and an optional polaroid of the shop */}
        <div className={`relative ${config.image2 ? "mb-10 md:mb-0" : ""}`}>
          <Stamp text={config.stamp_text || "Since 2003 · Kolhapur"} />
          <div className="relative aspect-[5/4] overflow-hidden rounded-[26px] bg-blush">
            {embed ? (
              <iframe src={normalizeEmbedUrl(embed)} className="absolute inset-0 h-full w-full" frameBorder={0} allow="autoplay; fullscreen; picture-in-picture" title="Brand story video" />
            ) : vid ? (
              <video src={vid} className="absolute inset-0 h-full w-full object-cover" controls playsInline preload="metadata" />
            ) : (
              <Media src={img} alt="The Jack & Jill family in Kolhapur" className="absolute inset-0 h-full w-full object-[50%_30%]" sizes="(min-width:768px) 52vw, 100vw" />
            )}
          </div>
          {config.image2 && (
            <figure className="absolute -bottom-10 right-3 w-[40%] max-w-[220px] rotate-[4deg] rounded-[14px] bg-white p-2 pb-1 shadow-premium transition-transform duration-500 ease-premium hover:rotate-0 md:-right-6">
              <span className="relative block aspect-square overflow-hidden rounded-[9px] bg-cream">
                <Media src={config.image2} alt={config.image2_caption || "Our store"} className="absolute inset-0 h-full w-full" sizes="220px" />
              </span>
              {config.image2_caption && <figcaption className="font-hand px-1 py-1.5 text-center text-[15px] leading-tight text-navy">{config.image2_caption}</figcaption>}
            </figure>
          )}
        </div>

        <div>
          <div className="sh grid gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B]">Our story</p>
            <h2 className="font-display text-[28px] md:text-4xl lg:text-[40px] leading-[1.1] text-navy text-balance">{title ?? "The Jack & Jill Story"}</h2>
            <p className="font-hand text-[22px] md:text-2xl leading-snug text-[#C2621B]">{subtitle ?? "Kolhapur's trusted kids brand since 2003."}</p>
          </div>

          <p className="mt-5 text-[15px] md:text-base leading-relaxed text-ink/85 whitespace-pre-line">
            {text ||
              "Ajit Mehta opened the first Jack & Jill store in Shahupuri, Kolhapur in 2003. Since then thousands of families have dressed their little ones with us — from newborn cuddles to school days and festival best. Everything we pick is soft on skin, made to last and chosen the way a parent would."}
          </p>

          {config.quote && (
            <blockquote className="mt-6 rounded-[20px] bg-white px-5 py-4 shadow-soft">
              <p className="font-hand text-xl leading-snug text-navy">&ldquo;{config.quote}&rdquo;</p>
              {config.quote_by && <footer className="mt-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-muted">— {config.quote_by}</footer>}
            </blockquote>
          )}

          {stats.length > 0 && (
            <dl className={`stagger mt-7 grid border-y border-line py-5 ${stats.length === 3 ? "grid-cols-3" : stats.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {stats.map((s, i) => (
                <div key={i} className={`flex flex-col-reverse justify-end gap-1.5 px-2 text-center ${i > 0 ? "border-l border-line" : ""}`}>
                  <dt className="text-[11px] md:text-xs font-bold uppercase tracking-[0.08em] text-muted leading-tight">{s.label}</dt>
                  <dd className="font-display text-2xl md:text-[32px] leading-none text-navy">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/about" className="inline-flex items-center rounded-full bg-navy hover:bg-ink text-white px-6 py-3.5 text-[15px] font-bold transition-colors">
              Read our story
            </Link>
            <Link href="/shop" className="inline-flex items-center rounded-full border-2 border-navy text-navy px-6 py-3 text-[15px] font-bold hover:bg-navy hover:text-white transition-colors">
              Explore the shop
            </Link>
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
