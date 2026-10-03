import { Instagram, Facebook, Youtube, Star } from "lucide-react";
import type { Social } from "@/lib/social";

/** Google "G" in brand colours (drawn, no image). */
export function GoogleG({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}

/** Five stars filled to the rating (e.g. 4.7 → four and most of the fifth). */
export function Stars({ rating, className = "w-3.5 h-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={`${className} text-[#F5B301]/30`} fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${className} text-[#F5B301]`} fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * "★★★★★ 4.8 · 320 Google reviews" — links to the Google profile.
 * Shows nothing until the rating and the link are filled in Settings,
 * so the site never shows a made-up number.
 */
export function GoogleRating({ social, tone = "dark", size = "md", className = "" }: { social: Social; tone?: "dark" | "light"; size?: "sm" | "md"; className?: string }) {
  if (!social.google_rating || !social.google_reviews_url) return null;
  const light = tone === "light";
  const count = social.google_review_count;
  return (
    <a
      href={social.google_reviews_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/g inline-flex w-fit max-w-full items-center gap-2 whitespace-nowrap rounded-full transition-colors ${
        size === "sm" ? "text-[13px]" : `px-4 py-2 text-sm shadow-soft ${light ? "bg-white/10 hover:bg-white/15" : "bg-white hover:bg-cream"}`
      } ${light ? "text-white" : "text-navy"} ${className}`}
      aria-label={`Rated ${social.google_rating} out of 5 on Google${count ? ` from ${count} reviews` : ""}. Read the reviews`}
    >
      <GoogleG className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      <b className="font-extrabold tabular-nums">{social.google_rating.toFixed(1)}</b>
      <Stars rating={social.google_rating} className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {count && <span className={light ? "text-white/75" : "text-muted"}>({count.toLocaleString("en-IN")}{size === "sm" ? "" : " reviews"})</span>}
    </a>
  );
}

/** Round icon links: Instagram, Facebook, YouTube, Google reviews. */
export function SocialIcons({ social, tone = "dark", className = "", hideGoogle = false }: { social: Social; tone?: "dark" | "light"; className?: string; hideGoogle?: boolean }) {
  const items = [
    social.instagram && { href: social.instagram, label: "Instagram", icon: <Instagram className="w-[18px] h-[18px]" /> },
    social.facebook && { href: social.facebook, label: "Facebook", icon: <Facebook className="w-[18px] h-[18px]" /> },
    social.youtube && { href: social.youtube, label: "YouTube", icon: <Youtube className="w-[18px] h-[18px]" /> },
    !hideGoogle && social.google_reviews_url && { href: social.google_reviews_url, label: "Google reviews", icon: <GoogleG className="w-[17px] h-[17px]" /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];
  if (!items.length) return null;
  const btn =
    tone === "light"
      ? "bg-white/10 text-white hover:bg-white hover:text-navy"
      : "bg-white text-navy shadow-soft hover:bg-navy hover:text-white";
  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {items.map((it) => (
        <li key={it.label}>
          <a href={it.href} target="_blank" rel="noopener noreferrer" aria-label={it.label} title={it.label} className={`grid h-10 w-10 place-items-center rounded-full transition-all duration-300 ease-premium hover:-translate-y-0.5 ${btn}`}>
            {it.icon}
          </a>
        </li>
      ))}
    </ul>
  );
}
