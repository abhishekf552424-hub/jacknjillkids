import Link from "next/link";
import { Home, ShoppingBag, Search } from "lucide-react";

export const metadata = {
  title: "Page not found — Jack & Jill",
  description: "This little page wandered off. Let's get you back to shopping.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container py-16 md:py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-premium mb-6">
        <ShoppingBag className="w-11 h-11" />
      </div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">404</p>
      <h1 className="mt-2 font-display text-4xl md:text-6xl text-navy tracking-tight leading-none">This little page wandered off</h1>
      <p className="mt-4 text-muted max-w-md">
        Looks like the page you&apos;re looking for tip-toed away. Let&apos;s get you back to something delightful.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-navy text-white rounded-md px-6 py-3 font-bold hover:opacity-90 transition-opacity"
          data-testid="notfound-home"
        >
          <Home className="w-4 h-4" /> Take me home
        </Link>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 border-2 border-gold text-gold rounded-md px-6 py-3 font-bold hover:bg-gold hover:text-white transition-all"
          data-testid="notfound-shop"
        >
          <Search className="w-4 h-4" /> Browse shop
        </Link>
      </div>
    </div>
  );
}
