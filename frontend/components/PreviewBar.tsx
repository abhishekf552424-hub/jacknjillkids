"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/** Shown only to admins while the site is still "Coming soon" (cookie set by middleware). */
export default function PreviewBar() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(/(?:^|;\s*)jj_preview=1/.test(document.cookie));
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
