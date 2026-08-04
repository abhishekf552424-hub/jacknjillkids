import Link from "next/link";
import Image from "next/image";

type Card = {
  image?: string;
  headline?: string;
  subtext?: string;
  link?: string;
  // Phase O — per-card style controls
  overlay_opacity?: number;      // 0-100 %, default 55
  overlay_color?: string;        // any CSS color, default "#0a1e3f" (navy)
  heading_color?: string;        // any CSS color, default "#ffffff"
  border_radius?: "none" | "soft" | "rounded" | "pill"; // default "soft" (matches existing rounded-lg)
};

const DEFAULTS: Card[] = [
  { headline: "Free Shipping ₹999+", subtext: "On every order across India", link: "/shop" },
  { headline: "Easy 7-Day Returns", subtext: "No-questions-asked exchanges", link: "/legal/returns" },
  { headline: "New Arrivals", subtext: "Fresh drops every week", link: "/shop?sort=newest" },
];

const RADIUS_CLASSES: Record<string, string> = {
  none: "rounded-none",
  soft: "rounded-lg",
  rounded: "rounded-2xl",
  pill: "rounded-[32px]",
};

export default function PromoStrip({
  cards,
  title,
  subtitle,
}: {
  cards?: Card[];
  title?: string | null;
  subtitle?: string | null;
}) {
  const list = ((cards ?? []).length ? cards : DEFAULTS)!.slice(0, 3);

  return (
    <section className="container py-12 md:py-16" data-testid="promo-strip">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h2 className="font-display text-2xl md:text-3xl text-navy tracking-tight">{title}</h2>}
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {list.map((c, i) => {
          const overlayOpacity = typeof c.overlay_opacity === "number" ? Math.max(0, Math.min(100, c.overlay_opacity)) : 55;
          const overlayColor = c.overlay_color || "#0a1e3f";
          const headingColor = c.heading_color || "#ffffff";
          const radiusCls = RADIUS_CLASSES[c.border_radius || "soft"];
          const inner = (
            <div className={`group relative aspect-[4/3] md:aspect-[5/4] overflow-hidden bg-navy shadow-soft hover:shadow-premium transition-shadow ${radiusCls}`}>
              {c.image ? (
                <Image src={c.image} alt={c.headline || ""} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-brand-gradient" />
              )}
              {overlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
                />
              )}
              <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end" style={{ color: headingColor }}>
                {c.headline && <p className="font-display text-xl md:text-2xl leading-tight" style={{ color: headingColor }}>{c.headline}</p>}
                {c.subtext && <p className="mt-1 text-sm opacity-90" style={{ color: headingColor }}>{c.subtext}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-gold font-bold opacity-90">
                  Explore →
                </span>
              </div>
            </div>
          );
          return c.link ? (
            <Link key={i} href={c.link} data-testid={`promo-card-${i}`} className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${radiusCls}`}>
              {inner}
            </Link>
          ) : (
            <div key={i} data-testid={`promo-card-${i}`}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
