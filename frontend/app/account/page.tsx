import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import SignOutBtn from "./SignOutBtn";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const list = (orders ?? []) as Order[];

  return (
    <div className="container py-12 md:py-20 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Account</p>
          <h1 className="font-display text-3xl md:text-4xl text-navy">Hi {profile?.full_name || user.email?.split("@")[0]},</h1>
          <p className="text-muted mt-1">Manage your orders, wishlist and addresses.</p>
        </div>
        <div className="flex gap-3">
          {profile?.role && profile.role !== "customer" && (
            <Link href="/admin" data-testid="admin-link" className="border-2 border-gold text-gold rounded px-4 py-2 text-sm font-medium hover:bg-gold hover:text-white transition-colors">Admin Panel</Link>
          )}
          <SignOutBtn />
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <Link href="/account" className="bg-white rounded-lg p-5 shadow-soft hover:shadow-premium transition-shadow">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Orders</p>
          <p className="mt-2 font-display text-2xl text-navy">{list.length}</p>
          <p className="text-sm text-muted mt-1">Total placed</p>
        </Link>
        <Link href="/track" className="bg-white rounded-lg p-5 shadow-soft hover:shadow-premium transition-shadow">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Track</p>
          <p className="mt-2 font-display text-2xl text-navy">Live</p>
          <p className="text-sm text-muted mt-1">Track an order</p>
        </Link>
        <Link href="/shop" className="bg-white rounded-lg p-5 shadow-soft hover:shadow-premium transition-shadow">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">Continue</p>
          <p className="mt-2 font-display text-2xl text-navy">Shop</p>
          <p className="text-sm text-muted mt-1">Browse the store</p>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl text-navy mb-4">Recent orders</h2>
        {list.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-soft">
            <p className="text-muted">No orders yet.</p>
            <Link href="/shop" className="inline-block mt-4 bg-navy text-white rounded px-6 py-3 text-sm">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((o) => (
              <Link key={o.id} href={`/orders/${o.order_number}`} className="block bg-white rounded-lg p-5 shadow-soft hover:shadow-premium transition-shadow flex justify-between items-center gap-4">
                <div>
                  <p className="text-xs text-muted">Order</p>
                  <p className="font-medium text-navy">{o.order_number}</p>
                  <p className="text-xs text-muted mt-1">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs px-3 py-1 rounded-full bg-cream text-navy font-medium capitalize">{o.status.replace(/_/g, " ")}</span>
                  <p className="mt-1 font-display text-lg text-navy">{formatINR(o.total)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
