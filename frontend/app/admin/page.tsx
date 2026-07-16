import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, ShoppingBag, Users, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const [{ data: recentOrders }, { count: orderCount }, { count: productCount }, { count: userCount }, { data: lowStock }] = await Promise.all([
    admin.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("product_variants").select("id, sku, stock_qty, product:products(name)").lte("stock_qty", 5).order("stock_qty").limit(8),
  ]);

  const revenue = (recentOrders ?? []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Overview</p>
      <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Orders" value={orderCount ?? 0} icon={ShoppingBag} />
        <Stat label="Revenue (recent)" value={formatINR(revenue)} icon={TrendingUp} />
        <Stat label="Active products" value={productCount ?? 0} icon={ShoppingBag} />
        <Stat label="Customers" value={userCount ?? 0} icon={Users} />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-gold underline">View all</Link>
          </div>
          <div className="divide-y divide-navy/5">
            {(recentOrders ?? []).map((o: any) => (
              <Link key={o.id} href={`/admin/orders/${o.order_number}`} className="flex items-center justify-between py-3 hover:bg-cream/50 px-2 -mx-2 rounded">
                <div>
                  <p className="text-sm font-medium text-navy">{o.order_number}</p>
                  <p className="text-xs text-muted">{new Date(o.created_at).toLocaleString("en-IN")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">{formatINR(o.total)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold">{o.status.replace(/_/g, " ")}</p>
                </div>
              </Link>
            ))}
            {(recentOrders ?? []).length === 0 && <p className="text-sm text-muted py-3">No orders yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-error" />
            <h2 className="font-display text-xl text-navy">Low stock</h2>
          </div>
          <ul className="divide-y divide-navy/5">
            {(lowStock ?? []).map((v: any) => (
              <li key={v.id} className="py-2.5">
                <p className="text-sm text-navy line-clamp-1">{v.product?.name} — {v.sku}</p>
                <p className="text-xs text-error font-medium">{v.stock_qty} left</p>
              </li>
            ))}
            {(lowStock ?? []).length === 0 && <p className="text-sm text-muted">All stocked up ✓</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted font-bold">{label}</p>
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <p className="mt-3 font-display text-2xl md:text-3xl text-navy">{value}</p>
    </div>
  );
}
