"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Boxes, FolderTree, ShoppingCart, Users, Ticket, LayoutTemplate, FileText, Settings,
  Menu, X, LogOut, ExternalLink, RotateCcw, LifeBuoy, MessageSquare, UserCog, Search, Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/admin/NotificationBell";
import { ROLE_LABEL, canAccess, type AdminRole, type AdminSection } from "@/lib/admin-roles";

type Counts = { orders: number; support: number; returns: number; reviews: number; stock: number };
type NavItem = { href: string; label: string; hint: string; icon: any; section: AdminSection; badge?: keyof Counts };

const GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "", items: [{ href: "/admin", label: "Dashboard", hint: "Today's sales and what needs doing", icon: LayoutDashboard, section: "dashboard" }] },
  {
    title: "Orders & customers",
    items: [
      { href: "/admin/orders", label: "Orders", hint: "Confirm, pack, ship, print invoice", icon: ShoppingCart, section: "orders", badge: "orders" },
      { href: "/admin/returns", label: "Returns & exchanges", hint: "Size exchange and return requests", icon: RotateCcw, section: "returns", badge: "returns" },
      { href: "/admin/support", label: "Customer queries", hint: "Messages from the website chat", icon: LifeBuoy, section: "support", badge: "support" },
      { href: "/admin/customers", label: "Customers", hint: "Who bought, how often", icon: Users, section: "customers" },
    ],
  },
  {
    title: "Products",
    items: [
      { href: "/admin/products", label: "Products", hint: "Add or edit products, photos, prices", icon: Package, section: "products" },
      { href: "/admin/stock", label: "Stock", hint: "Update how many pieces are left", icon: Boxes, section: "stock", badge: "stock" },
      { href: "/admin/categories", label: "Categories", hint: "Shop sections like Boys, Girls", icon: FolderTree, section: "categories" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons & offers", hint: "Discount codes", icon: Ticket, section: "coupons" },
      { href: "/admin/homepage", label: "Homepage", hint: "Banners and sections on the home page", icon: LayoutTemplate, section: "homepage" },
      { href: "/admin/reviews", label: "Reviews", hint: "Approve or hide customer reviews", icon: MessageSquare, section: "reviews", badge: "reviews" },
      { href: "/admin/cms", label: "Pages & FAQs", hint: "About, policies, FAQs, trust badges", icon: FileText, section: "cms" },
    ],
  },
  {
    title: "Shop setup",
    items: [
      { href: "/admin/team", label: "Team & access", hint: "Add staff and choose what they can do", icon: UserCog, section: "team" },
      { href: "/admin/settings", label: "Settings", hint: "Delivery charges, COD, contact details", icon: Settings, section: "settings" },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

function matchItem(pathname: string) {
  return [...ALL_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname === n.href || pathname.startsWith(n.href + "/")));
}

function Badge({ n, tone = "action" }: { n: number; tone?: "action" | "light" }) {
  if (!n) return null;
  return (
    <span
      className={`ml-auto min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-5 text-center ${tone === "action" ? "bg-action text-white" : "bg-white text-action"}`}
      aria-label={`${n} waiting`}
    >
      {n > 99 ? "99+" : n}
    </span>
  );
}

export default function AdminShell({
  role,
  name,
  logoUrl,
  logoSize = 40,
  children,
}: {
  role: AdminRole;
  name: string;
  logoUrl?: string;
  logoSize?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ orders: 0, support: 0, returns: 0, reviews: 0, stock: 0 });
  const [q, setQ] = useState("");
  const pathname = usePathname() || "/admin";
  const router = useRouter();

  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(role, i.section)) })).filter((g) => g.items.length);
  const current = matchItem(pathname);

  // Keep people out of sections their role can't use (the server checks too).
  useEffect(() => {
    if (current && !canAccess(role, current.section)) router.replace("/admin");
  }, [current, role, router]);

  useEffect(() => setOpen(false), [pathname]);

  const loadCounts = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/counts", { cache: "no-store" });
      if (r.ok) setCounts(await r.json());
    } catch {
      /* badges are optional */
    }
  }, []);

  useEffect(() => {
    loadCounts();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadCounts();
    }, 30_000);
    return () => clearInterval(t);
  }, [loadCounts, pathname]);

  const signOut = async () => {
    await createClient().auth.signOut();
    await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  };

  const findOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    router.push(`/admin/orders?q=${encodeURIComponent(v)}`);
    setQ("");
  };

  const logo = logoUrl ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={logoUrl} alt="Jack & Jill" style={{ height: Math.min(logoSize, 40) }} className="w-auto object-contain" />
  ) : (
    <span className="flex items-baseline gap-1 font-display font-bold text-navy text-xl">
      Jack <span className="text-gold-text">&amp;</span> Jill
    </span>
  );

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));

  const tabs = (
    [
      { href: "/admin", label: "Home", icon: LayoutDashboard, section: "dashboard" },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, section: "orders", badge: "orders" },
      { href: "/admin/stock", label: "Stock", icon: Boxes, section: "stock", badge: "stock" },
      { href: "/admin/support", label: "Queries", icon: LifeBuoy, section: "support", badge: "support" },
    ] as { href: string; label: string; icon: any; section: AdminSection; badge?: keyof Counts }[]
  ).filter((t) => canAccess(role, t.section));

  return (
    <div data-admin className="min-h-screen bg-[#F6F4EF] text-ink flex">
      {/* Sidebar: always visible on desktop, slide-in drawer on phones */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] w-[272px] shrink-0 bg-white border-r border-line flex flex-col transition-transform duration-200 ${open ? "translate-x-0 shadow-premium" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Admin menu"
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-line">
          <Link href="/admin" className="flex items-center gap-2" data-testid="admin-logo">
            {logo}
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted border border-line rounded px-1.5 py-0.5">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-2 -mr-2 text-muted" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
          {groups.map((g) => (
            <div key={g.title || "top"} className="mb-3">
              {g.title && <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">{g.title}</p>}
              <ul className="space-y-0.5">
                {g.items.map((n) => {
                  const active = isActive(n.href);
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        title={n.hint}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors ${
                          active ? "bg-navy text-white font-semibold" : "text-ink hover:bg-cream"
                        }`}
                      >
                        <n.icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-gold-light" : "text-doodle"}`} />
                        <span className="truncate">{n.label}</span>
                        {n.badge && <Badge n={counts[n.badge]} tone={active ? "light" : "action"} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-butter text-navy font-bold flex items-center justify-center uppercase">{(name || "?").slice(0, 1)}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy truncate">{name}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[role]}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/" target="_blank" className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-semibold text-navy hover:bg-cream">
              <ExternalLink className="w-3.5 h-3.5" /> View shop
            </Link>
            <button onClick={signOut} className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-semibold text-navy hover:bg-cream">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-ink/40 z-40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-line px-3 sm:px-6 flex items-center gap-3">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-cream">
            <Menu className="w-5 h-5 text-navy" />
          </button>
          <div className="lg:hidden">{logo}</div>
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-navy truncate">{current?.label ?? "Admin"}</p>
            {current?.hint && <p className="text-xs text-muted truncate">{current.hint}</p>}
          </div>

          {canAccess(role, "orders") && (
            <form onSubmit={findOrder} className="hidden md:flex items-center ml-auto w-full max-w-xs" role="search">
              <label className="relative w-full">
                <span className="sr-only">Find an order</span>
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find order no., name or phone"
                  className="w-full rounded-lg border border-line bg-cream/60 pl-9 pr-3 py-2 text-sm outline-none focus:border-doodle focus:bg-white"
                />
              </label>
            </form>
          )}

          <div className="ml-auto md:ml-0 flex items-center gap-2">
            {canAccess(role, "products") && (
              <Link href="/admin/products/new" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-action hover:bg-action-hover text-white px-3.5 py-2 text-sm font-semibold">
                <Plus className="w-4 h-4" /> Add product
              </Link>
            )}
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>

      {/* Bottom tabs on phones: the things used every day */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-line flex pb-[env(safe-area-inset-bottom)]"
        aria-label="Quick menu"
      >
        {tabs.map((t) => {
          const active = isActive(t.href);
          const n = t.badge ? counts[t.badge] : 0;
          return (
            <Link key={t.href} href={t.href} className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-navy" : "text-muted"}`}>
              <t.icon className={`w-5 h-5 ${active ? "text-action" : ""}`} />
              {t.label}
              {n > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 min-w-[16px] h-4 px-1 rounded-full bg-action text-white text-[10px] leading-4 text-center">{n > 99 ? "99+" : n}</span>
              )}
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-muted">
          <Menu className="w-5 h-5" />
          More
        </button>
      </nav>
    </div>
  );
}
