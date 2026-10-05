"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { getVimeoBackgroundUrl } from "@/lib/embeds";
import { safeHref } from "@/components/home/Section";

type Slide = {
  image?: string;
  video_url?: string;
  /** An uploaded mp4/webm (Admin → Homepage → Hero → upload a video) */
  video?: string;
  heading?: string;
  subheading?: string;
  cta_text?: string;
  cta_link?: string;
  // Phase O — per-slide style controls
  overlay_opacity?: number;      // 0-100 (%), default 20
  overlay_color?: string;        // any CSS color, default "#1F2650" (navy)
  heading_color?: string;        // any CSS color, default "#ffffff"
  heading_size?: "sm" | "md" | "lg"; // preset scale, default "lg"
  cta_style?: "gradient" | "outline" | "navy"; // default "gradient"
  content_position?: "left" | "center" | "right"; // default "left"
  border_radius?: "none" | "soft" | "rounded" | "pill"; // corner style, default "soft"
  // Festive extras (all optional)
  script_line?: string; // small handwritten line above the heading
  highlight?: string; // words of the heading shown in gold with a hand-drawn underline
  offer?: string; // round sticker on the picture, e.g. "15% OFF"
  offer_code?: string; // coupon code customers can tap to copy
  offer_note?: string; // small print, e.g. "On orders above ₹999 · till 20 Oct"
};

/** Heading with the chosen words picked out in gold. */
function Heading({ text, highlight }: { text: string; highlight?: string }) {
  const h = (highlight || "").trim();
  const at = h ? text.toLowerCase().indexOf(h.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <span className="jj-hl">{text.slice(at, at + h.length)}</span>
      {text.slice(at + h.length)}
    </>
  );
}

/** Round festive sticker: "15% OFF" → big "15%", small "OFF". */
function OfferSticker({ offer }: { offer: string }) {
  const m = offer.trim().match(/^(₹?\s?\d+%?)\s*(.*)$/);
  const big = m ? m[1] : offer;
  const small = m ? m[2] : "";
  const points = Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2, r = i % 2 ? 46 : 50;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <div className="jj-sticker pointer-events-none absolute z-10 top-3 right-3 md:top-6 md:right-8 w-[62px] h-[62px] sm:w-[86px] sm:h-[86px] md:w-[120px] md:h-[120px]" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-lg">
        <polygon points={points} fill="#FCD325" stroke="#ffffff" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#354275" strokeWidth="1" strokeDasharray="2 3" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-navy leading-none -rotate-6">
        <span className="font-display font-bold text-[17px] sm:text-[24px] md:text-[34px] tracking-tight">{big}</span>
        {small && <span className="mt-0.5 text-[8px] sm:text-[10px] md:text-[12px] font-extrabold uppercase tracking-[0.18em]">{small}</span>}
      </div>
    </div>
  );
}

function CodePill({ code, note }: { code: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}
      className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-dashed border-gold-light/80 bg-[#1F2650]/55 px-3.5 py-1.5 text-white text-[11px] sm:text-xs"
      aria-label={`Copy coupon code ${code}`}
      data-testid="hero-code"
    >
      <span className="font-bold">Use code <span className="font-mono tracking-wider text-brand-yellow">{code}</span></span>
      {note && <span className="hidden xl:inline text-white/75">· {note}</span>}
      {copied ? <Check className="w-3.5 h-3.5 text-brand-yellow" /> : <Copy className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />}
    </button>
  );
}

const HEADING_SIZE_CLASSES: Record<string, string> = {
  sm: "text-2xl sm:text-3xl lg:text-4xl",
  md: "text-[24px] sm:text-4xl lg:text-[44px] xl:text-5xl",
  lg: "text-[26px] sm:text-4xl lg:text-5xl xl:text-6xl",
};

const CONTENT_POS_CLASSES: Record<string, string> = {
  left: "lg:w-[58%] xl:w-1/2 lg:mr-auto text-left",
  center: "lg:w-3/4 mx-auto text-center",
  right: "lg:w-[58%] xl:w-1/2 lg:ml-auto text-left lg:text-right",
};

// Corner style presets — consistent with PromoStrip radii for a unified system.
const RADIUS_CLASSES: Record<string, string> = {
  none: "rounded-none",
  soft: "rounded-[12px]",
  rounded: "rounded-[24px]",
  pill: "rounded-[40px]",
};

function CtaButton({ style, text, link }: { style: string; text: string; link: string }) {
  const base = "inline-flex items-center gap-2 font-bold rounded-full px-5 py-2.5 text-sm sm:text-base sm:px-6 sm:py-3 md:px-8 md:py-4 hover:-translate-y-0.5 transition-transform";
  if (style === "outline") {
    return (
      <Link href={safeHref(link)} data-testid="hero-cta" className={`${base} border-2 border-white text-white hover:bg-white hover:text-navy`}>
        {text} <ChevronRight className="w-4 h-4" />
      </Link>
    );
  }
  if (style === "navy") {
    return (
      <Link href={safeHref(link)} data-testid="hero-cta" className={`${base} bg-navy text-white shadow-premium`}>
        {text} <ChevronRight className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <Link href={safeHref(link)} data-testid="hero-cta" className={`${base} bg-action hover:bg-action-hover text-white shadow-premium`}>
      {text} <ChevronRight className="w-4 h-4" />
    </Link>
  );
}

/** One slide's photo/video + overlay. `enter` fades it in (CSS, no JS library). */
function SlideMedia({ s, enter = false, priority = false }: { s: Slide; enter?: boolean; priority?: boolean }) {
  const bgVideo = s.video_url ? getVimeoBackgroundUrl(s.video_url) : null;
  const overlayOpacity = typeof s.overlay_opacity === "number" ? Math.max(0, Math.min(100, s.overlay_opacity)) : 20;
  const overlayColor = s.overlay_color || "#1F2650";
  return (
    <div className={`absolute inset-0 ${enter ? "animate-hero-in" : ""}`}>
      {bgVideo ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe
            src={bgVideo}
            title={s.heading || "Hero video"}
            frameBorder={0}
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute top-1/2 left-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 border-0"
          />
        </div>
      ) : s.video && /^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(s.video) ? (
        <video src={s.video} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      ) : s.image ? (
        <Image src={s.image} alt={s.heading || "Hero"} fill priority={priority} sizes="(min-width: 1400px) 1340px, 100vw" className={`object-cover ${enter ? "kenburns" : ""}`} />
      ) : null}
      {/* Per-slide flat overlay — 0% opacity renders NO overlay at all */}
      {overlayOpacity > 0 && <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }} />}
    </div>
  );
}

export default function HeroCarousel({ slides, title, subtitle }: { slides: Slide[]; title?: string | null; subtitle?: string | null }) {
  const [i, setI] = useState(0);
  const changed = useRef(false);
  useEffect(() => {
    if (i !== 0) changed.current = true;
  }, [i]);
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(true);
  const touchX = useRef(0);
  // True only for the very first slide shown after the page loads.
  const landing = i === 0 && !changed.current;
  // Defensive filter: a slide with neither an image nor a video configured
  // (e.g. an admin-added slide that was never finished) would otherwise
  // render as a blank navy box for its entire ~6s turn — not just during
  // transitions. Only ever show slides that actually have visual content.
  const validSlides = slides.filter((sl) => Boolean(sl.image || sl.video_url || sl.video));
  const list: Slide[] = validSlides.length ? validSlides : [{
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1600",
    heading: title ?? "Tiny Steps, Big Smiles",
    subheading: subtitle ?? "Style • Comfort • Care",
    cta_text: "Shop New Arrivals",
    cta_link: "/shop?sort=newest",
  }];

  useEffect(() => {
    if (list.length < 2) return;
    // Autoplay is driven by the active dot's fill animation (see onAnimationEnd),
    // so pausing on hover keeps the dot and the slide perfectly in step.
    // People who ask for reduced motion get no autoplay at all.
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, [list.length]);

  // Remember the slide we came from, for the cross-fade.
  const last = useRef(0);
  const [prev, setPrev] = useState<number | null>(null);
  useEffect(() => {
    if (last.current === i) return;
    setPrev(last.current);
    last.current = i;
    const t = window.setTimeout(() => setPrev(null), 950);
    return () => window.clearTimeout(t);
  }, [i]);

  const s = list[i];
  const hasWords = Boolean((s.heading && s.heading.trim()) || s.script_line || s.offer_code);
  const hasCta = Boolean(s.cta_text && s.cta_link && s.cta_text.trim() && s.cta_link.trim());
  const headingColor = s.heading_color || "#ffffff";
  const headingSizeCls = HEADING_SIZE_CLASSES[s.heading_size || "lg"];
  const posCls = CONTENT_POS_CLASSES[s.content_position || "left"];
  const radiusCls = RADIUS_CLASSES[s.border_radius || "soft"];

  return (
    <section className="relative overflow-hidden bg-cream" data-testid="hero-carousel">
      <div className="relative container py-4 md:py-8">
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            // Swipe left/right on phones.
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (list.length > 1 && Math.abs(dx) > 45) setI((v) => (v + (dx < 0 ? 1 : -1) + list.length) % list.length);
          }}
          className={`group/hero relative w-full overflow-hidden bg-navy ${radiusCls}`}
        >
          {/* Picture. On phones it stays clean (words go in the panel below);
              on tablets/desktops the words sit on the picture. */}
          <div className="relative w-full aspect-[2/1] sm:aspect-[16/9] lg:aspect-[21/9] max-h-[720px] overflow-hidden">
            {/* The previous slide stays underneath while the new one fades in on top. */}
            {prev !== null && prev !== i && list[prev] && <SlideMedia key={`m-${prev}`} s={list[prev]} />}
            <SlideMedia key={`m-${i}`} s={s} enter={!landing} priority={landing} />
            {hasWords && (
              <div aria-hidden="true" className={`hidden lg:block pointer-events-none absolute inset-0 ${s.content_position === "right" ? "bg-gradient-to-l" : s.content_position === "center" ? "bg-[#1F2650]/30" : "bg-gradient-to-r"} from-[#1F2650]/75 via-[#1F2650]/25 to-transparent`} />
            )}
            {/* phones: a soft fade into the panel below */}
            {hasWords && <div aria-hidden="true" className="lg:hidden pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-navy to-transparent" />}
            {s.offer && <OfferSticker key={`o-${i}`} offer={s.offer} />}

            {list.length > 1 && (
              <>
                <button
                  onClick={() => setI((v) => (v - 1 + list.length) % list.length)}
                  className="hidden md:flex absolute z-20 left-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/85 hover:bg-white text-navy shadow-soft opacity-0 -translate-x-2 group-hover/hero:opacity-100 group-hover/hero:translate-x-0 focus-visible:opacity-100 transition-all duration-300 ease-premium"
                  aria-label="Previous slide"
                  data-testid="hero-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setI((v) => (v + 1) % list.length)}
                  className="hidden md:flex absolute z-20 right-6 top-1/2 -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white/85 hover:bg-white text-navy shadow-soft opacity-0 translate-x-2 group-hover/hero:opacity-100 group-hover/hero:translate-x-0 focus-visible:opacity-100 transition-all duration-300 ease-premium"
                  aria-label="Next slide"
                  data-testid="hero-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute z-20 bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {list.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setI(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ease-premium ${idx === i ? "w-10 bg-white/40" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                      data-testid={`hero-dot-${idx}`}
                    >
                      {idx === i &&
                        (calm ? (
                          <span className="absolute inset-0 rounded-full bg-white" />
                        ) : (
                          <span
                            key={i}
                            onAnimationEnd={() => setI((v) => (v + 1) % list.length)}
                            className={`dot-fill absolute inset-0 rounded-full bg-white ${paused ? "[animation-play-state:paused]" : ""}`}
                          />
                        ))}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Words: a navy panel under the picture on phones, on the picture from tablets up. */}
          {(hasWords || hasCta) && (
            <div className="relative lg:absolute lg:inset-0 lg:flex lg:items-center lg:pointer-events-none" data-testid="hero-words">
              <div
                className={`w-full px-5 pt-3 pb-5 min-h-[164px] sm:min-h-0 sm:px-8 sm:pt-5 sm:pb-7 lg:p-14 lg:pointer-events-auto ${posCls}`}
                style={{ ["--hc" as string]: headingColor }}
              >
                {s.subheading && (
                  <p
                    key={`sub-${i}`}
                    style={landing ? undefined : { animationDelay: "150ms" }}
                    className={`${landing ? "" : "animate-hero-text"} uppercase tracking-[0.28em] text-gold-light text-[10px] sm:text-xs font-bold mb-1.5 lg:mb-3`}
                  >
                    {s.subheading}
                  </p>
                )}
                {s.script_line && (
                  <p
                    key={`sc-${i}`}
                    style={landing ? undefined : { animationDelay: "200ms" }}
                    className={`${landing ? "" : "animate-hero-text"} font-hand text-brand-yellow text-[19px] sm:text-2xl lg:text-[34px] leading-tight -rotate-1 origin-left mb-1 lg:mb-2 lg:[text-shadow:0_2px_10px_rgba(0,0,0,.35)]`}
                  >
                    {s.script_line}
                  </p>
                )}
                <h1
                  key={`h-${i}`}
                  className={`${landing ? "" : "animate-hero-text [animation-delay:250ms]"} font-display leading-[1.08] tracking-tight text-white lg:text-[color:var(--hc)] lg:[text-shadow:0_2px_18px_rgba(0,0,0,.25)] ${headingSizeCls}`}
                >
                  <Heading text={s.heading ?? "Tiny Steps, Big Smiles"} highlight={s.highlight} />
                </h1>
                {(hasCta || s.offer_code) && (
                  <div key={`c-${i}`} className={`${landing ? "" : "animate-hero-text [animation-delay:400ms]"} mt-4 lg:mt-8 flex flex-wrap items-center gap-2.5 sm:gap-4 ${s.content_position === "center" ? "justify-center" : s.content_position === "right" ? "lg:justify-end" : ""}`}>
                    {hasCta && <CtaButton style={s.cta_style || "gradient"} text={s.cta_text!} link={s.cta_link!} />}
                    {s.offer_code && <CodePill code={s.offer_code} note={s.offer_note} />}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
