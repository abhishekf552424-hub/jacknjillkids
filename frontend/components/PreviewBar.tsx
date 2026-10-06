"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/** Shown only to signed-in admins while the site is still "Coming soon" (checked with the server). */
export default function PreviewBar() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // The cookie is only a hint; the server confirms this really is a signed-in admin
    // and that the site is still "Coming soon" before the bar is shown.
    if (!/(?:^|;\s*)jj_preview=1/.test(document.cookie)) return;
    let alive = true;
    fetch("/api/site-mode", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { preview: false }))
      .then((d: { preview?: boolean }) => alive && setOn(d.preview === true))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  if (!on) return null;
  return (
    <div className="fixed left-3 bottom-3 z-[75] flex items-center gap-2 rounded-full bg-ink/95 text-white pl-3 pr-1.5 py-1.5 text-xs shadow-premium" data-testid="preview-bar">
      <Eye className="w-4 h-4 text-brand-yellow" aria-hidden="true" />
      <span><b>Preview</b><span className="hidden sm:inline"> · customers see “Coming soon”</span></span>
      <Link href="/admin/settings#site-mode" className="rounded-full bg-brand-yellow text-navy px-3 py-1 font-bold hover:bg-white">Go live</Link>
    </div>
  );
}
