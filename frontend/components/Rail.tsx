"use client";

import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// useLayoutEffect warns during server rendering; this runs it only in the browser.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Endless horizontal carousel used across the storefront.
 *
 * How the "endless" part works: when the cards don't all fit on screen, the
 * list is drawn three times side by side and we start on the middle copy.
 * Whenever scrolling comes to rest near either outer copy, we silently jump
 * back to the same card in the middle copy. The jump lands on an identical
 * card, so the shopper never sees it — the row simply never ends, in either
 * direction, by swipe or by arrow.
 *
 * - The server sends one copy (fast, no duplicate content for Google);
 *   the extra copies are added in the browser and hidden from screen readers
 *   and the keyboard.
 * - If every card already fits, there is no loop and no arrows.
 */
export default function Rail({
  children,
  label,
  itemClassName,
  gapClassName = "gap-3 md:gap-5",
  loop = true,
}: {
  children: ReactNode;
  label: string;
  /** Width of each card, e.g. "w-[42%] sm:w-[30%] lg:w-[15%]". */
  itemClassName: string;
  gapClassName?: string;
  loop?: boolean;
}) {
  const items = Children.toArray(children);
  const n = items.length;
  const track = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [looping, setLooping] = useState(false);
  // Copies are only added once the row is near the screen and the browser is
  // idle, so the first load stays light (better speed score).
  const [awake, setAwake] = useState(false);
  const touching = useRef(false);
  const settleTimer = useRef<number>(0);

  /** Distance from one copy of a card to the same card in the next copy. */
  const period = useCallback(() => {
    const el = track.current;
    if (!el || el.children.length < n * 2) return 0;
    return (el.children[n] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
  }, [n]);

  /** Instant, invisible jump (no smooth scrolling, no snap fight). */
  const jumpTo = (el: HTMLDivElement, left: number) => {
    el.style.scrollBehavior = "auto";
    el.style.scrollSnapType = "none";
    el.scrollLeft = left;
    // Restore on the next frame so snapping keeps working for the shopper.
    requestAnimationFrame(() => {
      el.style.scrollBehavior = "";
      el.style.scrollSnapType = "";
    });
  };

  /** Keep the view on the middle copy once scrolling has come to rest. */
  const recentre = useCallback(() => {
    const el = track.current;
    const p = period();
    if (!el || !p || touching.current) return;
    if (el.scrollLeft < p * 0.5) jumpTo(el, el.scrollLeft + p);
    else if (el.scrollLeft > p * 1.5) jumpTo(el, el.scrollLeft - p);
  }, [period]);

  // Decide whether the row overflows (only then do we loop and show arrows).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const check = () => {
      if (!n || el.children.length < n) return;
      // Width of ONE copy of the cards, measured the same way in both modes.
      const first = el.children[0] as HTMLElement;
      const last = el.children[n - 1] as HTMLElement;
      const oneCopy = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const over = oneCopy > el.clientWidth - pad * 2 + 4;
      setOverflow(over);
      setLooping(over && loop && n > 1 && awake);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loop, n, awake]);

  useEffect(() => {
    const el = track.current;
    if (!el || awake) return;
    let idle = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined;
        idle = ric ? ric(() => setAwake(true), { timeout: 600 }) : window.setTimeout(() => setAwake(true), 120);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
      if (cic) cic(idle);
      else window.clearTimeout(idle);
    };
  }, [awake]);

  // When the copies appear, start on the middle copy at the same card.
  useIsoLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    if (!looping) {
      jumpTo(el, 0);
      return;
    }
    const p = period();
    if (p) jumpTo(el, el.scrollLeft + p);
    if (pending.current) {
      const dir = pending.current;
      pending.current = 0;
      requestAnimationFrame(() => goRef.current(dir));
    }
  }, [looping]);

  // Recentre after every scroll comes to rest (swipe, fling, arrow, trackpad).
  useEffect(() => {
    const el = track.current;
    if (!el || !looping) return;
    const onScroll = () => {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(recentre, 140);
    };
    const down = () => {
      touching.current = true;
    };
    const up = () => {
      touching.current = false;
      onScroll();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchend", up, { passive: true });
    el.addEventListener("touchcancel", up, { passive: true });
    return () => {
      window.clearTimeout(settleTimer.current);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchend", up);
      el.removeEventListener("touchcancel", up);
    };
  }, [looping, recentre]);

  const pending = useRef<0 | 1 | -1>(0);
  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    if (!looping && loop && !awake) {
      // Tapped before the endless copies were added: add them, then move.
      pending.current = dir;
      setAwake(true);
      return;
    }
    const first = el.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = first ? first.offsetWidth + gap : el.clientWidth * 0.8;
    // Move by one screen of whole cards.
    const per = Math.max(1, Math.floor((el.clientWidth + gap) / step));
    if (looping) {
      // A quick double-tap could outrun the resting check; recentre first.
      window.clearTimeout(settleTimer.current);
      recentre();
    }
    el.scrollBy({ left: dir * per * step, behavior: "smooth" });
  };

  const goRef = useRef(go);
  goRef.current = go;

  const copies = looping ? (["a", "b", "c"] as const) : (["b"] as const);

  const btn =
    "w-10 h-10 md:w-11 md:h-11 rounded-full border border-line bg-white text-navy flex items-center justify-center shadow-soft transition-all duration-300 ease-premium hover:bg-navy hover:text-white hover:border-navy active:scale-90";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        tabIndex={0}
        className={cn(
          "stagger flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth overscroll-x-contain -mx-4 px-4 scroll-px-4 pt-3 pb-8 -mt-3 -mb-5 outline-none focus-visible:ring-2 focus-visible:ring-doodle/40 rounded-2xl",
          gapClassName,
        )}
      >
        {copies.map((copy) =>
          items.map((child, i) => {
            const clone = copy !== "b";
            return (
              <div
                // The middle copy keeps the server's keys, so nothing reloads when copies are added.
                key={`${copy}:${(child as { key?: string }).key ?? i}`}
                className={cn("shrink-0 snap-start", itemClassName)}
                style={{ ["--i" as string]: Math.min(i, 8) }}
                aria-hidden={clone || undefined}
                inert={clone || undefined}
              >
                {child}
              </div>
            );
          }),
        )}
      </div>

      {overflow && (
        <div className="mt-4 md:mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Previous" className={btn}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next" className={btn}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
