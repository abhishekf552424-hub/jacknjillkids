"use client";

import { useEffect } from "react";

/**
 * The private order link has a secret "?t=…" part. Keep it in a cookie for this
 * browser (so reloading still works) and remove it from the address bar, so it
 * is never sent to Google/Meta or copied by accident.
 */
export default function StripOrderToken({ orderNumber }: { orderNumber: string }) {
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const t = url.searchParams.get("t");
      if (!t) return;
      const secure = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `jj_ot_${orderNumber}=${encodeURIComponent(t)}; path=/; max-age=${60 * 60 * 24 * 60}; samesite=lax${secure}`;
      url.searchParams.delete("t");
      window.history.replaceState(window.history.state, "", url.pathname + (url.search || "") + url.hash);
    } catch {
      /* not important enough to break the page */
    }
  }, [orderNumber]);
  return null;
}
