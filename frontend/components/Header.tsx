"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronRight, ChevronDown, Phone, Truck, RotateCcw, MapPin, PackageSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, AgeGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import CartDrawer from "./CartDrawer";
import { cart } from "@/lib/cart";
import { WhatsAppIcon } from "./WhatsAppIcon";

/**
 * Site header.
 *  - Utility bar: one rotating promise on phones, all promises + phone/track links on desktop.
 *  - Main bar: logo (left or centred, from admin settings), category nav with
 *    dropdowns on desktop, icons on the right. Phones show menu · logo · search · bag.
 *  - Drawer (phones/tablets): search, categories with sub-categories, ages, help links, call/WhatsApp.
 */

const POPULAR = ["Frocks", "School bags", "Baby swaddle", "Party wear", "Toys"];

function waLink(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length === 10 ? "91" + digits : digits}`;
}

export default function Header({
  categoriesTree,
  ageGroups,
  logoUrl,
  storeName = "Jack & Jill",
  logoSizeMobile = 36,
  logoSizeTablet = 44,
  logoSizeDesktop = 52,
  logoAlign = "left",
  phone,
  freeShippingAbove = 999,
  exchangeDays = 7,
}: {
  categoriesTree: Category[];
  ageGroups: AgeGroup[];
  logoUrl?: string;
  storeName?: string;
  logoSizeMobile?: number;
  logoSizeTablet?: number;
  logoSizeDesktop?: number;
  logoAlign?: "left" | "center";
  phone?: string;
  freeShippingAbove?: number;
  exchangeDays?: number;
}) {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoverCat, setHoverCat] = useState<string | null>(null);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [msg, setMsg] = useState(0);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const promises = [
    { icon: Truck, text: `Free delivery above ₹${freeShippingAbove.toLocaleString("en-IN")}` },
    { icon: RotateCcw, text: `Easy ${exchangeDays}-day size exchange` },
    { icon: MapPin, text: "Kolhapur's kids store since 2003" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onCart = () => setCount(cart.count());
    onScroll();
    onCart();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onOpen = () => setCartOpen(true);
    window.addEventListener("cart:update", onCart);
    window.addEventListener("cart:open", onOpen);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("cart:update", onCart);
      window.removeEventListener("cart:open", onOpen);
    };
  }, []);

  // Rotate the promise line on phones.
  useEffect(() => {
    const t = setInterval(() => setMsg((m) => (m + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close panels when the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setHoverCat(null);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, menuOpen]);

  const styleVars = {
    ["--logo-h-mobile"]: `${logoSizeMobile}px`,
    ["--logo-h-tablet"]: `${logoSizeTablet}px`,
    ["--logo-h-desktop"]: `${logoSizeDesktop}px`,
  } as React.CSSProperties;

  const logo = logoUrl ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={logoUrl} alt={storeName} className="jj-logo-img w-auto object-contain" />
  ) : (
    <span className="flex items-baseline gap-1 font-display text-2xl md:text-3xl font-bold text-navy">
      Jack <span className="text-brand-orange">&amp;</span> Jill
    </span>
  );

  const isActive = (slug: string) => pathname === `/category/${slug}` || pathname.startsWith(`/category/${slug}/`);
  const wa = waLink(phone);
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const enterCat = (id: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverCat(id);
  };
  const leaveCat = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverCat(null), 120);
  };

  const iconBtn = "relative inline-flex items-center justify-center w-10 h-10 rounded-full text-navy hover:bg-navy/5 transition-colors";

  const Icons = (
    <div className="flex items-center gap-0.5 sm:gap-1 justify-self-end">
      <button data-testid="search-toggle" aria-label="Search" aria-expanded={searchOpen} onClick={() => setSearchOpen((v) => !v)} className={iconBtn}>
        {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>
      <Link href="/account/wishlist" aria-label="Wishlist" data-testid="wishlist-link" className={cn(iconBtn, "hidden sm:inline-flex")}>
        <Heart className="w-5 h-5" />
      </Link>
      <Link href="/account" aria-label="My account" data-testid="account-link" className={cn(iconBtn, "hidden sm:inline-flex")}>
        <User className="w-5 h-5" />
      </Link>
      <button data-testid="cart-toggle" aria-label={`Bag, ${count} item${count === 1 ? "" : "s"}`} onClick={() => setCartOpen(true)} className={iconBtn}>
        <ShoppingBag className="w-5 h-5" />
        {count > 0 && (
          <span data-testid="cart-count" className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-action text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    </div>
  );

  const Hamburger = (
    <button data-testid="hamburger-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)} className={cn(iconBtn, "lg:hidden -ml-2")}>
      <Menu className="w-6 h-6" />
    </button>
  );

  const DesktopNav = (
    <nav className="hidden lg:flex items-center" aria-label="Shop categories">
      {categoriesTree.slice(0, 7).map((c) => {
        const kids = c.children ?? [];
        const open = hoverCat === c.id && kids.length > 0;
        return (
          <div key={c.id} className="relative" onMouseEnter={() => enterCat(c.id)} onMouseLeave={leaveCat}>
            <Link
              href={`/category/${c.slug}`}
              data-testid={`nav-${c.slug}`}
              aria-haspopup={kids.length > 0 ? "true" : undefined}
              aria-expanded={kids.length > 0 ? open : undefined}
              onFocus={() => enterCat(c.id)}
              className={cn(
                "group relative flex items-center gap-1 px-2.5 xl:px-3 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors",
                isActive(c.slug) || open ? "text-navy" : "text-ink/80 hover:text-navy",
              )}
            >
              {c.name}
              {kids.length > 0 && <ChevronDown className={cn("w-3.5 h-3.5 opacity-50 transition-transform", open && "rotate-180")} />}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-2.5 right-2.5 xl:left-3 xl:right-3 -bottom-px h-0.5 rounded-full bg-brand-orange origin-left transition-transform duration-200",
                  isActive(c.slug) || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />
            </Link>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 top-full pt-3 z-50"
                >
                  <div className="w-[300px] bg-white rounded-2xl shadow-premium border border-line p-2">
                    <ul className={cn("grid gap-0.5", kids.length > 6 && "grid-cols-2 w-[420px]")}>
                      {kids.map((s) => (
                        <li key={s.id}>
                          <Link href={`/category/${s.slug}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-ink hover:bg-cream hover:text-navy">
                            <CatThumb c={s} size={28} />
                            <span className="truncate">{s.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href={`/category/${c.slug}`} className="mt-1 flex items-center justify-between rounded-xl bg-cream px-3 py-2.5 text-sm font-semibold text-navy hover:bg-butter">
                      View all {c.name}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <style jsx global>{`
        .jj-logo-img { height: var(--logo-h-mobile); }
        @media (min-width: 640px) { .jj-logo-img { height: var(--logo-h-tablet); } }
        @media (min-width: 1024px) { .jj-logo-img { height: var(--logo-h-desktop); } }
      `}</style>

      {/* Utility bar */}
      <div className="bg-navy text-white text-[13px]">
        <div className="container h-9 flex items-center justify-center lg:justify-between gap-4">
          {/* phones: one line at a time */}
          <div className="lg:hidden relative h-9 w-full overflow-hidden" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={msg}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {(() => {
                  const P = promises[msg];
                  return (
                    <>
                      <P.icon className="w-3.5 h-3.5 text-gold-light" aria-hidden="true" />
                      {P.text}
                    </>
                  );
                })()}
              </motion.p>
            </AnimatePresence>
          </div>
          {/* desktop: everything */}
          <ul className="hidden lg:flex items-center gap-6 text-white/90">
            {promises.map((p) => (
              <li key={p.text} className="flex items-center gap-2">
                <p.icon className="w-3.5 h-3.5 text-gold-light" aria-hidden="true" />
                {p.text}
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex items-center gap-5 text-white/90">
            <Link href="/track" className="flex items-center gap-1.5 hover:text-white">
              <PackageSearch className="w-3.5 h-3.5 text-gold-light" aria-hidden="true" /> Track order
            </Link>
            {tel && (
              <a href={tel} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="w-3.5 h-3.5 text-gold-light" aria-hidden="true" /> {phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <header
        data-testid="site-header"
        style={styleVars}
        className={cn("sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition-shadow", scrolled ? "border-line shadow-soft" : "border-line/70")}
      >
        {logoAlign === "center" ? (
          <>
            <div className="container h-16 lg:h-[76px] grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center min-w-0">
                {Hamburger}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden lg:flex items-center gap-2 w-full max-w-[260px] rounded-full border border-line bg-cream/60 px-4 py-2.5 text-sm text-muted hover:border-navy/30"
                >
                  <Search className="w-4 h-4" aria-hidden="true" /> Search products
                </button>
              </div>
              <Link href="/" data-testid="logo-link" aria-label={`${storeName} home`} className="justify-self-center flex items-center">
                {logo}
              </Link>
              {Icons}
            </div>
            {/* Desktop: categories on their own row under the centred logo */}
            <div className="hidden lg:block border-t border-line/70">
              <div className="container flex justify-center h-12 items-stretch [&_nav]:h-full [&_nav>div]:flex [&_nav>div>a]:h-full">{DesktopNav}</div>
            </div>
          </>
        ) : (
          <div className="container h-16 lg:h-[76px] flex items-center gap-2 sm:gap-4">
            {Hamburger}
            <Link href="/" data-testid="logo-link" aria-label={`${storeName} home`} className="flex items-center mr-1 lg:mr-4">
              {logo}
            </Link>
            <div className="flex-1 min-w-0">{DesktopNav}</div>
            {Icons}
          </div>
        )}

        {/* Search */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-line bg-white"
            >
              <form action="/search" method="get" role="search" className="container py-4" onSubmit={() => setSearchOpen(false)}>
                <label className="relative block max-w-2xl mx-auto">
                  <span className="sr-only">Search the shop</span>
                  <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    name="q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    autoFocus
                    data-testid="search-input"
                    placeholder="Search frocks, school bags, toys…"
                    className="w-full rounded-full border border-line bg-cream/60 pl-12 pr-28 py-3.5 text-[15px] text-ink outline-none focus:border-navy focus:bg-white"
                  />
                  <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-navy text-white px-5 py-2.5 text-sm font-semibold hover:bg-ink">Search</button>
                </label>
                <div className="max-w-2xl mx-auto mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Popular:</span>
                  {POPULAR.map((p) => (
                    <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-line px-3 py-1 text-navy hover:bg-cream">
                      {p}
                    </Link>
                  ))}
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Drawer — phones and tablets */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/50 lg:hidden" onClick={() => setMenuOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm bg-white lg:hidden flex flex-col"
              data-testid="hamburger-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              style={styleVars}
            >
              <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-line">
                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center">
                  {logo}
                </Link>
                <button data-testid="menu-close" aria-label="Close menu" onClick={() => setMenuOpen(false)} className={iconBtn}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form action="/search" method="get" role="search" className="p-4 pb-2" onSubmit={() => setMenuOpen(false)}>
                  <label className="relative block">
                    <span className="sr-only">Search the shop</span>
                    <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input name="q" placeholder="Search products" className="w-full rounded-full border border-line bg-cream/60 pl-10 pr-4 py-3 text-[15px] outline-none focus:border-navy focus:bg-white" />
                  </label>
                </form>

                <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Shop by category</p>
                <ul className="px-2">
                  {categoriesTree.map((c) => {
                    const kids = c.children ?? [];
                    const expanded = openCat === c.id;
                    return (
                      <li key={c.id} className="border-b border-line/70 last:border-0">
                        <div className="flex items-center">
                          <Link href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)} data-testid={`ham-cat-${c.slug}`} className="flex-1 flex items-center gap-3 px-2 py-3 text-[15px] font-semibold text-navy">
                            <CatThumb c={c} size={36} />
                            {c.name}
                          </Link>
                          {kids.length > 0 && (
                            <button
                              onClick={() => setOpenCat(expanded ? null : c.id)}
                              aria-expanded={expanded}
                              aria-label={`${expanded ? "Hide" : "Show"} ${c.name} sections`}
                              className="w-11 h-11 flex items-center justify-center text-muted"
                            >
                              <ChevronDown className={cn("w-5 h-5 transition-transform", expanded && "rotate-180")} />
                            </button>
                          )}
                        </div>
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden pl-[58px] pr-2">
                              {kids.map((s) => (
                                <li key={s.id}>
                                  <Link href={`/category/${s.slug}`} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm text-ink hover:text-navy">
                                    {s.name}
                                  </Link>
                                </li>
                              ))}
                              <li>
                                <Link href={`/category/${c.slug}`} onClick={() => setMenuOpen(false)} className="block py-2.5 pb-3.5 text-sm font-semibold text-doodle">
                                  View all {c.name}
                                </Link>
                              </li>
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>

                {ageGroups.length > 0 && (
                  <>
                    <p className="px-4 pt-5 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Shop by age</p>
                    <div className="px-4 flex flex-wrap gap-2">
                      {ageGroups.map((a) => (
                        <Link
                          key={a.id}
                          href={`/shop?age=${a.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="px-3.5 py-2 rounded-full border border-line text-sm font-semibold text-navy hover:bg-cream"
                        >
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}

                <p className="px-4 pt-6 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Help &amp; account</p>
                <ul className="px-4">
                  {[
                    { href: "/account", label: "My account", icon: User },
                    { href: "/account/wishlist", label: "Wishlist", icon: Heart },
                    { href: "/track", label: "Track order", icon: PackageSearch },
                    { href: "/contact", label: "Contact us", icon: Phone },
                    { href: "/about", label: "Our story", icon: MapPin },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 py-3 text-[15px] text-ink border-b border-line/70">
                        <l.icon className="w-[18px] h-[18px] text-doodle" aria-hidden="true" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {(tel || wa) && (
                <div className="shrink-0 border-t border-line p-4 grid grid-cols-2 gap-2 bg-cream/60">
                  {tel && (
                    <a href={tel} className="flex items-center justify-center gap-2 rounded-full border border-navy/20 bg-white py-2.5 text-sm font-semibold text-navy">
                      <Phone className="w-4 h-4" /> Call store
                    </a>
                  )}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#1F7A4A] py-2.5 text-sm font-semibold text-white">
                      <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} freeShippingAbove={freeShippingAbove} />
    </>
  );
}

/** Round category picture, or a soft coloured initial when there is no picture. */
function CatThumb({ c, size }: { c: Category; size: number }) {
  const tones = ["bg-blush text-brand-red", "bg-butter text-warning", "bg-sky text-doodle", "bg-cream text-gold-text"];
  const tone = tones[(c.name?.charCodeAt(0) ?? 0) % tones.length];
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-full flex items-center justify-center font-bold", !c.image_url && tone)} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {c.image_url ? <Image src={c.image_url} alt="" fill className="object-cover" sizes={`${size}px`} /> : c.name?.slice(0, 1)}
    </span>
  );
}
