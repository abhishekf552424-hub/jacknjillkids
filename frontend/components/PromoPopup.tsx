"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function PromoPopup({ popup }: { popup: any }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!popup?.enabled) return;
    // date window
    const now = new Date();
    if (popup.start_date && new Date(popup.start_date) > now) return;
    if (popup.end_date && new Date(popup.end_date + "T23:59:59") < now) return;
    if (popup.frequency === "session" && sessionStorage.getItem("jj_promo_seen") === "1") return;
    const t = setTimeout(() => {
      setOpen(true);
      if (popup.frequency === "session") sessionStorage.setItem("jj_promo_seen", "1");
    }, (popup.delay_seconds || 2) * 1000);
    return () => clearTimeout(t);
  }, [popup]);

  if (!open || !popup) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center px-4" onClick={() => setOpen(false)}>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60"><X className="w-4 h-4" /></button>
        {popup.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <a href={popup.link || "#"}><img src={popup.image_url} alt="" className="w-full h-auto" /></a>
        )}
        {(popup.headline || popup.subtext) && (
          <div className="p-5 text-center">
            {popup.headline && <div className="font-display text-xl text-navy">{popup.headline}</div>}
            {popup.subtext && <div className="text-sm text-neutral-600 mt-1">{popup.subtext}</div>}
            {popup.link && <a href={popup.link} className="inline-block mt-3 bg-navy text-white rounded-full px-5 py-2 text-sm">Explore</a>}
          </div>
        )}
      </div>
    </div>
  );
}
