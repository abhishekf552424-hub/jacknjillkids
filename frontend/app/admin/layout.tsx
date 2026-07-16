import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Ticket, LayoutTemplate, FileText, Settings, LogOut, TrendingUp } from "lucide-react";
import SignOutBtn from "../account/SignOutBtn";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirect=/admin");
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "customer") redirect("/account");

  const nav = [
    { href: "/admin",              label: "Dashboard",  icon: LayoutDashboard, roles: ["super_admin", "order_manager", "content_manager"] },
    { href: "/admin/orders",       label: "Orders",     icon: ShoppingCart,    roles: ["super_admin", "order_manager"] },
    { href: "/admin/products",     label: "Products",   icon: Package,         roles: ["super_admin", "content_manager"] },
    { href: "/admin/categories",   label: "Categories", icon: FolderTree,      roles: ["super_admin", "content_manager"] },
    { href: "/admin/customers",    label: "Customers",  icon: Users,           roles: ["super_admin"] },
    { href: "/admin/coupons",      label: "Coupons",    icon: Ticket,          roles: ["super_admin", "content_manager"] },
    { href: "/admin/homepage",     label: "Homepage",   icon: LayoutTemplate,  roles: ["super_admin", "content_manager"] },
    { href: "/admin/cms",          label: "CMS",        icon: FileText,        roles: ["super_admin", "content_manager"] },
    { href: "/admin/settings",     label: "Settings",   icon: Settings,        roles: ["super_admin"] },
  ];

  const items = nav.filter((n) => n.roles.includes(profile.role));

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-screen bg-cream">
      <aside className="hidden md:block bg-navy text-white py-8 px-4 sticky top-0 h-screen">
        <Link href="/admin" className="flex items-baseline gap-1 px-2 mb-8">
          <span className="font-display text-2xl font-bold text-white">Jack</span>
          <span className="font-display text-2xl font-bold text-gold">&amp;</span>
          <span className="font-display text-2xl font-bold text-white">Jill</span>
        </Link>
        <p className="text-xs uppercase tracking-widest text-gold font-bold px-2 mb-3">Admin</p>
        <nav className="flex flex-col gap-1">
          {items.map((n) => (
            <Link key={n.href} href={n.href} data-testid={`admin-nav-${n.label.toLowerCase()}`} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm hover:bg-white/5 transition-colors">
              <n.icon className="w-4 h-4 text-gold" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-xs opacity-70 hover:opacity-100 px-3 py-2">← Back to store</Link>
          <div className="border-t border-white/10 pt-3">
            <p className="text-xs text-white/60 px-3">{profile.full_name || user.email}</p>
            <p className="text-[10px] text-gold px-3 uppercase tracking-widest">{profile.role.replace(/_/g, " ")}</p>
          </div>
        </div>
      </aside>
      <div className="p-6 md:p-10 overflow-x-hidden">
        <div className="md:hidden mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 bg-white rounded-full px-3 py-1.5 text-xs text-navy border border-navy/10">
              {n.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
