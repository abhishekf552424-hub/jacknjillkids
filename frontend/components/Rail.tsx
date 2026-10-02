"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontal carousel used across the homepage.
 * - Swipe on phones, arrows + progress bar on every screen size
 * - Snaps each card to the container edge
 * - Arrows switch off at the ends; controls hide when everything already fits
 * - Cards fade up one after another when the section scrolls into view
 */
export default function Rail({
  children,
  label,
  itemClassName,
  gapClassName = "gap-3 md:gap-5",
}: {
  children: ReactNode;
  label: string;
  /** Width of each card, e.g. "w-[42%] sm:w-[30%] lg:w-[15%]". */
  itemClassName: string;
  gapClassName?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ start: true, end: false, progress: 0, overflow: false, thumb: 100 });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const overflow = max > 4;
    setState({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
      progress: overflow ? el.scrollLeft / max : 0,
      overflow,
      thumb: overflow ? Math.max(14, (el.clientWidth / el.scrollWidth) * 100) : 100,
    });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = first ? first.offsetWidth + gap : el.clientWidth * 0.8;
    // Move by one screen of whole cards.
    const per = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    el.scrollBy({ left: dir * per * step, behavior: "smooth" });
  };

  const btn =
    "w-10 h-10 md:w-11 md:h-11 rounded-full border border-line bg-white text-navy flex items-center justify-center shadow-soft transition-all duration-300 ease-premium hover:bg-navy hover:text-white hover:border-navy active:scale-90 disabled:opacity-35 disabled:pointer-events-none";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        tabIndex={0}
        className={cn(
          "stagger flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth -mx-4 px-4 scroll-px-4 pt-3 pb-8 -mt-3 -mb-5 outline-none focus-visible:ring-2 focus-visible:ring-doodle/40 rounded-2xl",
          gapClassName,
        )}
      >
        {Children.map(children, (child, i) =>
          child ? (
            <div className={cn("shrink-0 snap-start", itemClassName)} style={{ ["--i" as string]: Math.min(i, 8) }}>
              {child}
            </div>
          ) : null,
        )}
      </div>

      {state.overflow && (
        <div className="mt-4 md:mt-5 flex items-center gap-4">
          <div className="relative h-1 flex-1 rounded-full bg-navy/10 overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-y-0 rounded-full bg-navy transition-[left] duration-150 ease-out"
              style={{ width: `${state.thumb}%`, left: `${state.progress * (100 - state.thumb)}%` }}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} disabled={state.start} aria-label="Previous" className={btn}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => go(1)} disabled={state.end} aria-label="Next" className={btn}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
