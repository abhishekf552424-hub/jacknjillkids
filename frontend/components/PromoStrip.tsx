import Link from "next/link";
import Image from "next/image";

type Card = { image?: string; headline?: string; subtext?: string; link?: string };

const DEFAULTS: Card[] = [
  { headline: "Free Shipping ₹999+", subtext: "On every order across India", link: "/shop" },
  { headline: "Easy 7-Day Returns", subtext: "No-questions-asked exchanges", link: "/legal/returns" },
  { headline: "New Arrivals", subtext: "Fresh drops every week", link: "/shop?sort=newest" },
];

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
          const inner = (
            <div className="group relative aspect-[4/3] md:aspect-[5/4] rounded-lg overflow-hidden bg-navy shadow-soft hover:shadow-premium transition-shadow">
              {c.image ? (
                <Image src={c.image} alt={c.headline || ""} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 bg-brand-gradient" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-transparent" />
              <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end text-white">
                {c.headline && <p className="font-display text-xl md:text-2xl leading-tight">{c.headline}</p>}
                {c.subtext && <p className="mt-1 text-sm opacity-85">{c.subtext}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-gold font-bold opacity-90">
                  Explore →
                </span>
              </div>
            </div>
          );
          return c.link ? (
            <Link key={i} href={c.link} data-testid={`promo-card-${i}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded-lg">
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
