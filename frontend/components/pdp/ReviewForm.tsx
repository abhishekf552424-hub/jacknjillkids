"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return toast.error("Please choose 1 to 5 stars");
    setBusy(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, author_name: name, comment }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401) return setNeedLogin(true);
      if (!r.ok) return toast.error(j.error || "Could not send your review");
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl bg-sky/60 border border-doodle/20 p-4 text-sm text-navy flex gap-2">
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> Thank you! Your review will appear here after a quick check by our team.
      </div>
    );
  }
  if (needLogin) {
    return (
      <div className="rounded-xl bg-cream border border-line p-4 text-sm text-navy">
        Please{" "}
        <Link href={`/auth?next=${encodeURIComponent(`/product/${slug}#reviews`)}`} className="font-semibold text-doodle underline">
          sign in
        </Link>{" "}
        to write a review. It only takes a minute.
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} data-testid="write-review" className="rounded-full border-2 border-navy text-navy px-5 py-2.5 text-sm font-semibold hover:bg-navy hover:text-white transition-colors">
        Write a review
      </button>
    );
  }

  const shown = hover || rating;
  const label = ["", "Not good", "Okay", "Good", "Very good", "Loved it!"][shown];

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-white p-4 space-y-4" data-testid="review-form">
      <div>
        <p className="text-sm font-semibold text-navy mb-1">Your rating</p>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5"
            >
              <Star className={`w-7 h-7 ${shown >= n ? "text-brand-orange" : "text-line-strong/50"}`} fill={shown >= n ? "currentColor" : "none"} />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted">{label}</span>
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-navy">Your name</span>
        <input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya, Kolhapur" className="mt-1 w-full rounded-lg border border-line bg-cream/50 px-3 py-2.5 text-[15px] outline-none focus:border-navy focus:bg-white" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-navy">Your review (optional)</span>
        <textarea maxLength={1000} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the fit, fabric and quality?" className="mt-1 w-full rounded-lg border border-line bg-cream/50 px-3 py-2.5 text-[15px] outline-none focus:border-navy focus:bg-white" />
        <span className="block text-right text-xs text-muted">{comment.length}/1000</span>
      </label>
      <div className="flex gap-2">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-action hover:bg-action-hover text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Submit review
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2.5 text-sm font-semibold text-navy hover:bg-cream">
          Cancel
        </button>
      </div>
    </form>
  );
}
