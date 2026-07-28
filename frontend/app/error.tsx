"use client";

import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container py-16 md:py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-premium mb-6">
        <span className="font-display text-4xl font-bold">!</span>
      </div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Something broke</p>
      <h1 className="mt-2 font-display text-4xl md:text-6xl text-navy tracking-tight leading-none">Oops — a little hiccup</h1>
      <p className="mt-4 text-muted max-w-md">
        Something didn&apos;t quite go as planned. Give it another try, or head back home while we look into it.
      </p>
      {error?.digest && (
        <p className="mt-3 text-[11px] text-muted/70 font-mono">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-navy text-white rounded-md px-6 py-3 font-bold hover:opacity-90 transition-opacity"
          data-testid="error-retry"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 border-2 border-gold text-gold rounded-md px-6 py-3 font-bold hover:bg-gold hover:text-white transition-all"
          data-testid="error-home"
        >
          <Home className="w-4 h-4" /> Go home
        </Link>
      </div>
    </div>
  );
}
