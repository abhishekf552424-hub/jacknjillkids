"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * InitialSiteLoader — full-screen brand loader that shows ONLY on the
 * user's first landing to the site in this browsing session. It hides after
 * the first page has settled (window load + short delay) and does NOT reappear
 * on subsequent route transitions.
 *
 * Uses sessionStorage flag "jj_initial_loaded" so refreshes within the same
 * tab won't re-trigger the loader either.
 */
export default function InitialSiteLoader({ logoUrl }: { logoUrl?: string }) {
  const [show, setShow] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // If we've already shown it in this session, skip immediately.
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem("jj_initial_loaded") === "1";
    } catch {
      // sessionStorage may be blocked; behave as first-time.
    }
    if (alreadyShown) {
      setShow(false);
      return;
    }

    // Wait for window load event OR up to 1.6s max, whichever comes first.
    const markLoaded = () => {
      try {
        sessionStorage.setItem("jj_initial_loaded", "1");
      } catch {
        /* ignore */
      }
      setFadeOut(true);
      // remove from DOM after fade transition
      window.setTimeout(() => setShow(false), 450);
    };

    let done = false;
    const safety = window.setTimeout(() => {
      if (!done) {
        done = true;
        markLoaded();
      }
    }, 1600);

    const onReady = () => {
      if (done) return;
      done = true;
      window.clearTimeout(safety);
      // small settle delay so the animation feels intentional, not a flash
      window.setTimeout(markLoaded, 400);
    };

    if (document.readyState === "complete") {
      onReady();
    } else {
      window.addEventListener("load", onReady, { once: true });
    }

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("load", onReady);
    };
  }, []);

  if (!show) return null;

  const src = logoUrl || "/logo.png";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-cream transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      data-testid="initial-site-loader"
    >
      <div className="relative brand-loader" style={{ width: 128, height: 128 }}>
        {/* Rotating warm-gradient ring around the circular logo */}
        <span aria-hidden="true" className="absolute inset-0 rounded-full brand-loader-ring" />
        {/* Inner circular logo — round frame, exact brand icon */}
        <span
          aria-hidden="true"
          className="absolute inset-[10%] rounded-full bg-white shadow-soft overflow-hidden brand-loader-inner"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Image
            src={src}
            alt=""
            fill
            sizes="128px"
            className="object-contain p-[6%]"
            priority
          />
        </span>
      </div>
    </div>
  );
}
