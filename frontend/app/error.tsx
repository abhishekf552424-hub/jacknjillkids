"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-24 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="font-display text-6xl md:text-8xl text-navy tracking-tight">Oops</p>
      <p className="mt-4 text-lg text-muted">Something didn't quite go as planned.</p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="bg-navy text-white rounded px-6 py-3 font-medium">Try again</button>
        <Link href="/" className="border-2 border-gold text-gold rounded px-6 py-3 font-medium">Go home</Link>
      </div>
    </div>
  );
}
