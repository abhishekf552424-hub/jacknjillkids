"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Ticket, LayoutTemplate, FileText, Settings, Menu, X, LogOut, ArrowLeft, RotateCcw, LifeBuoy, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin",              label: "Dashboard",  icon: LayoutDashboard, roles: ["super_admin", "order_manager", "content_manager"] },
  { href: "/admin/orders",       label: "Orders",     icon: ShoppingCart,    roles: ["super_admin", "order_manager"] },
  { href: "/admin/products",     label: "Products",   icon: Package,         roles: ["super_admin", "content_manager"] },
  { href: "/admin/categories",   label: "Categories", icon: FolderTree,      roles: ["super_admin", "content_manager"] },
  { href: "/admin/customers",    label: "Customers",  icon: Users,           roles: ["super_admin"] },
  { href: "/admin/coupons",      label: "Coupons",    icon: Ticket,          roles: ["super_admin", "content_manager"] },
  { href: "/admin/homepage",     label: "Homepage",   icon: LayoutTemplate,  roles: ["super_admin", "content_manager"] },
  { href: "/admin/cms",          label: "CMS",        icon: FileText,        roles: ["super_admin", "content_manager"] },
  { href: "/admin/returns",      label: "Returns",    icon: RotateCcw,       roles: ["super_admin", "order_manager"] },
  { href: "/admin/reviews",      label: "Reviews",    icon: MessageSquare,   roles: ["super_admin", "content_manager"] },
  { href: "/admin/support",      label: "Support",    icon: LifeBuoy,        roles: ["super_admin", "order_manager"] },
  { href: "/admin/settings",     label: "Settings",   icon: Settings,        roles: ["super_admin"] },
];

export default function AdminShell({ role, name, children }: { role: string; name: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));
  const router = useRouter();

  const signOut = async () => {
    const s = createClient();
    await s.auth.signOut();
    document.cookie = "admin_2fa_ok=; Max-Age=0; path=/";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar (desktop) + Drawer (mobile) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-[260px] bg-navy text-white py-6 px-3 flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-2 flex items-center justify-between mb-6">
          <Link href="/admin" className="flex items-baseline gap-1" onClick={() => setOpen(false)}>
            <span className="font-display text-2xl font-bold text-white">Jack</span>
            <span className="font-display text-2xl font-bold text-gold">&amp;</span>
            <span className="font-display text-2xl font-bold text-white">Jill</span>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden text-white/70 p-1" aria-label="Close menu"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gold font-bold px-2 mb-3">Admin panel</p>
        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto no-scrollbar">
          {items.map((n) => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5"}`}
              >
                <n.icon className={`w-4 h-4 ${active ? "text-gold" : "text-white/60"}`} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-3 border-t border-white/10 pt-3 px-2">
          <p className="text-xs text-white/80 truncate">{name}</p>
          <p className="text-[10px] text-gold uppercase tracking-widest">{role.replace(/_/g, " ")}</p>
          <div className="mt-3 flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Back to store</Link>
            <button onClick={signOut} className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-neutral-200 px-4 py-3">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="p-1.5 rounded hover:bg-neutral-100"><Menu className="w-5 h-5 text-navy" /></button>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-lg font-bold text-navy">Jack</span>
            <span className="font-display text-lg font-bold text-gold">&amp;</span>
            <span className="font-display text-lg font-bold text-navy">Jill</span>
          </div>
          <div className="w-8" />
        </header>
        <main className="p-4 md:p-8 max-w-full">{children}</main>
      </div>
    </div>
  );
}
