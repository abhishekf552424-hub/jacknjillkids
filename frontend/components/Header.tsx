"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, AgeGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import CartDrawer from "./CartDrawer";
import { cart } from "@/lib/cart";

export default function Header({
  categoriesTree,
  ageGroups,
}: {
  categoriesTree: Category[];
  ageGroups: AgeGroup[];
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoverCat, setHoverCat] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    const onCart = () => setCount(cart.count());
    onCart();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("cart:update", onCart);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("cart:update", onCart);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-navy text-white text-xs md:text-sm py-2 text-center px-4">
        <span className="opacity-90">Free shipping on orders above ₹999 • Easy 7-day returns • Made with care in Kolhapur since 2003</span>
      </div>

      <header
        data-testid="site-header"
        className={cn(
          "sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-navy/5 transition-all",
          scrolled ? "py-2 shadow-soft" : "py-4",
        )}
      >
        <div className="container flex items-center gap-4">
          <button
            data-testid="hamburger-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-navy/5"
          >
            <Menu className="w-6 h-6 text-navy" />
          </button>

          <Link href="/" data-testid="logo-link" className="flex items-baseline gap-1 mr-4">
            <span className="font-display text-2xl md:text-3xl font-bold text-navy">Jack</span>
            <span className="font-display text-2xl md:text-3xl font-bold" style={{ background: "linear-gradient(135deg,#E63946,#F4A63E,#F7D34C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>&amp;</span>
            <span className="font-display text-2xl md:text-3xl font-bold text-navy">Jill</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {categoriesTree.slice(0, 7).map((c) => (
              <div
                key={c.id}
                className="relative"
                onMouseEnter={() => setHoverCat(c.id)}
                onMouseLeave={() => setHoverCat(null)}
              >
                <Link
                  href={`/shop?category=${c.slug}`}
                  data-testid={`nav-${c.slug}`}
                  className="px-3 py-2 text-sm font-medium text-navy hover:text-gold transition-colors"
                >
                  {c.name}
                </Link>
                <AnimatePresence>
                  {hoverCat === c.id && (c.children?.length ?? 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-full pt-3 w-64"
                    >
                      <div className="bg-white rounded-lg shadow-premium p-3 border border-navy/5">
                        {c.children!.map((s) => (
                          <Link
                            key={s.id}
                            href={`/shop?category=${s.slug}`}
                            className="flex items-center justify-between px-3 py-2 rounded-sm text-sm text-navy hover:bg-cream"
                          >
                            {s.name}
                            <ChevronRight className="w-4 h-4 opacity-40" />
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              data-testid="search-toggle"
              aria-label="Search"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-navy/5"
            >
              <Search className="w-5 h-5 text-navy" />
            </button>
            <Link href="/account/wishlist" aria-label="Wishlist" data-testid="wishlist-link" className="p-2 rounded-full hover:bg-navy/5">
              <Heart className="w-5 h-5 text-navy" />
            </Link>
            <button
              data-testid="cart-toggle"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
              className="p-2 rounded-full hover:bg-navy/5 relative"
            >
              <ShoppingBag className="w-5 h-5 text-navy" />
              {count > 0 && (
                <span data-testid="cart-count" className="absolute -top-0.5 -right-0.5 bg-brand-gradient text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
            <Link href="/account" aria-label="Account" data-testid="account-link" className="p-2 rounded-full hover:bg-navy/5">
              <User className="w-5 h-5 text-navy" />
            </Link>
          </div>
        </div>

        {/* Inline search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              action="/search"
              method="get"
              className="container overflow-hidden"
              onSubmit={() => setSearchOpen(false)}
            >
              <div className="py-3">
                <input
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoFocus
                  data-testid="search-input"
                  placeholder="Search for frocks, toys, school bags..."
                  className="w-full bg-white border border-navy/10 rounded px-4 py-3 text-sm text-navy focus:border-gold outline-none"
                />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </header>

      {/* Hamburger panel */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-navy/40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm bg-cream lg:hidden overflow-y-auto"
              data-testid="hamburger-panel"
            >
              <div className="flex items-center justify-between p-4 border-b border-navy/10">
                <span className="font-display text-2xl font-bold text-navy">Jack &amp; Jill</span>
                <button data-testid="menu-close" aria-label="Close" onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-navy/5">
                  <X className="w-6 h-6 text-navy" />
                </button>
              </div>

              {/* Rounded category carousel */}
              <div className="px-4 py-4">
                <p className="text-tiny uppercase tracking-widest text-muted mb-3 text-xs font-bold">Shop by category</p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {categoriesTree.map((c) => (
                    <Link
                      key={c.id}
                      href={`/shop?category=${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex flex-col items-center gap-2 min-w-[72px]"
                      data-testid={`ham-cat-${c.slug}`}
                    >
                      <div className={cn(
                        "w-16 h-16 relative overflow-hidden bg-white shadow-soft",
                        c.display_shape === "square" ? "rounded-lg" : "rounded-full",
                      )}>
                        {c.image_url ? (
                          <Image src={c.image_url} alt={c.name} fill className="object-cover" sizes="64px" />
                        ) : null}
                      </div>
                      <span className="text-xs text-navy text-center leading-tight">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="px-4 py-2">
                <p className="text-tiny uppercase tracking-widest text-muted mb-3 text-xs font-bold">Shop by age</p>
                <div className="flex flex-wrap gap-2">
                  {ageGroups.map((a) => (
                    <Link
                      key={a.id}
                      href={`/shop?age=${a.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="px-3 py-1.5 rounded-full bg-white border border-navy/10 text-sm text-navy hover:border-gold hover:text-gold transition-colors"
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4 mt-2 border-t border-navy/10">
                <div className="flex flex-col">
                  {[
                    { href: "/shop", label: "Shop All" },
                    { href: "/shop?sort=newest", label: "New Arrivals" },
                    { href: "/about", label: "About Us" },
                    { href: "/contact", label: "Contact" },
                    { href: "/faq", label: "FAQ" },
                    { href: "/track", label: "Track Order" },
                    { href: "/account", label: "My Account" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-3 text-navy border-b border-navy/5 flex items-center justify-between">
                      {l.label} <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
