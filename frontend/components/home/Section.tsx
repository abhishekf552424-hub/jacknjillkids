import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One rhythm for every homepage section: same vertical spacing, same header
 * (small orange label + Fredoka title + optional link), backgrounds that
 * alternate cream / white so the page breathes.
 */
export type Tone = "cream" | "white";

export function HomeSection({ tone = "cream", id, children, tight = false, testid }: { tone?: Tone; id?: string; children: ReactNode; tight?: boolean; testid?: string }) {
  return (
    <section id={id} data-testid={testid} className={`${tone === "white" ? "bg-white" : "bg-cream"} ${tight ? "py-8 md:py-12" : "py-12 md:py-20"}`}>
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkText = "View all",
  center = false,
}: {
  eyebrow?: string | null;
  title?: string | null;
  subtitle?: string | null;
  href?: string | null;
  linkText?: string;
  center?: boolean;
}) {
  if (!eyebrow && !title) return null;
  return (
    <div className={`mb-7 md:mb-9 flex flex-wrap items-end gap-3 ${center ? "justify-center text-center" : "justify-between"}`}>
      <div className={`grid gap-2 ${center ? "justify-items-center" : ""}`}>
        {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#C2621B]">{eyebrow}</p>}
        {title && <h2 className="font-display text-[28px] md:text-4xl lg:text-[40px] leading-[1.1] text-navy text-balance">{title}</h2>}
        {subtitle && <p className="text-muted text-[15px] md:text-base max-w-2xl">{subtitle}</p>}
      </div>
      {href && !center && (
        <Link href={href} className="inline-flex items-center gap-1.5 text-[15px] font-bold text-navy hover:text-action transition-colors">
          {linkText} <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** Photo-or-colour panel used by the new sections when no picture is uploaded yet. */
export function Media({ src, alt, className = "", sizes = "100vw", priority = false }: { src?: string | null; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return <div className={`bg-[#EFE6D3] ${className}`} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} sizes={sizes} loading={priority ? "eager" : "lazy"} className={`object-cover ${className}`} />;
}

/** Only allow site paths and normal web links in admin-entered links. */
export function safeHref(raw: unknown, fallback = "/shop"): string {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^https:\/\/[^\s]+$/i.test(v)) return v;
  return fallback;
}
