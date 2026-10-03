"use client";

import { useEffect, useState } from "react";

/**
 * Keeps a panel mounted long enough to animate out.
 * `mounted` — render it at all; `shown` — apply the "open" classes.
 * Replaces framer-motion's AnimatePresence with plain CSS transitions.
 */
export function usePresence(open: boolean, ms = 400) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [open, ms]);
  return { mounted, shown };
}
