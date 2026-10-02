"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  ShoppingBag, IndianRupee, Receipt, UserPlus, PackageCheck, Truck, Inbox, LifeBuoy, RotateCcw, AlertTriangle,
  MessageSquare, PackageX, ArrowUpRight, ArrowDownRight, Minus, Boxes, Shirt, RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AdminCard, StatusPill } from "@/components/admin/ui";
import { RANGE_KEYS, RANGE_LABEL, type DashboardStats, type RangeKey } from "@/lib/admin-analytics";

type Live = {
  range: RangeKey;
  showMoney: boolean;
  stats: DashboardStats;
  actions: { newOrders: number; toPack: number; toShip: number; openQueries: number; returnRequests: number; lowStock: number; pendingReviews: number; notBuyable?: number };
  newCustomers: number;
  feed: { id: string; order_number: string; total: number | null; status: string; payment_status: string; payment_method: string | null; created_at: string; customer: string | null; city: string | null }[];
  lowStock: { id: string; sku: string | null; size: string | null; stock: number; product: string }[];
  generatedAt: string;
};

const POLL_MS = 20_000;

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const inrShort = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);

const STATUS_LABEL: Record<string, string> = {
  placed: "New",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return asked",
  return_approved: "Return approved",
  refunded: "Refunded",
};
const STATUS_TONE: Record<string, "success" | "neutral" | "danger" | "warn" | "gold"> = {
  placed: "warn",
  confirmed: "gold",
  packed: "gold",
  shipped: "gold",
  out_for_delivery: "gold",
  delivered: "success",
  cancelled: "danger",
  return_requested: "danger",
  return_approved: "danger",
  refunded: "neutral",
};

function timeAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function greeting() {
  const h = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function LiveDashboard({ name }: { name: string }) {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [, tick] = useState(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const load = useCallback(async (r: RangeKey = rangeRef.current) => {
    try {
      const res = await fetch(`/api/admin/dashboard/live?range=${r}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not load the dashboard");
      if (r === rangeRef.current) {
        setData(j);
        setError("");
      }
    } catch (e: any) {
      setError(e.message || "Could not load the dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when the range changes, then refresh every 20 s while the tab is open.
  useEffect(() => {
    setLoading(true);
    load(range);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [range, load]);

  // Instant updates: listen for new / changed orders (Supabase Realtime).
  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => load(), 800);
    };
    const channel = supabase
      .channel("admin-dashboard-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload: any) => {
        const n = payload?.new?.order_number;
        toast.success(n ? `New order ${n}` : "New order received");
        refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, refresh)
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Re-render every 15 s so "updated x min ago" stays honest.
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const money = data?.showMoney ?? false;
  const k = data?.stats.kpis;
  const a = data?.actions;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold-text font-bold">Dashboard</p>
          <h1 className="font-display text-2xl sm:text-3xl text-navy tracking-tight">
            {greeting()}, {name.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              {live && <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live ? "bg-success" : "bg-line-strong"}`} />
            </span>
            {live ? "Live" : "Auto-refresh"} · {data ? `updated ${timeAgo(data.generatedAt)}` : "loading…"}
            <button onClick={() => load()} className="ml-1 p-1 rounded hover:bg-white" aria-label="Refresh now">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-line bg-white p-1" role="tablist" aria-label="Time period">
          {RANGE_KEYS.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 sm:px-4 py-1.5 text-sm font-semibold transition-colors ${range === r ? "bg-navy text-white" : "text-navy hover:bg-cream"}`}
            >
              {r === "today" ? "Today" : r.replace("d", " days")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-error/30 bg-blush px-4 py-3 text-sm text-error">
          {error}. Showing the last numbers we had. <button onClick={() => load()} className="underline font-semibold">Try again</button>
        </div>
      )}

      {/* What needs doing */}
      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="text-sm font-bold text-navy mb-2">Needs your attention</h2>
        <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 ${money ? "lg:grid-cols-4" : "xl:grid-cols-6"}`}>
          <ActionTile href="/admin/orders?status=placed" icon={Inbox} label="New orders" hint="Confirm them" n={a?.newOrders} urgent />
          <ActionTile href="/admin/orders?status=confirmed" icon={PackageCheck} label="To pack" hint="Confirmed" n={a?.toPack} />
          <ActionTile href="/admin/orders?status=packed" icon={Truck} label="Ready to ship" hint="Packed" n={a?.toShip} />
          <ActionTile href="/admin/support" icon={LifeBuoy} label="Queries" hint="Waiting for reply" n={a?.openQueries} urgent />
          <ActionTile href="/admin/returns" icon={RotateCcw} label="Return requests" hint="Waiting" n={a?.returnRequests} />
          <ActionTile href="/admin/stock?filter=low" icon={AlertTriangle} label="Low stock" hint="5 or less" n={a?.lowStock} />
          {money && <ActionTile href="/admin/reviews" icon={MessageSquare} label="Reviews" hint="To approve" n={a?.pendingReviews} />}
          {money && <ActionTile href="/admin/products" icon={PackageX} label="Can't be bought" hint="Add size / stock" n={a?.notBuyable} urgent />}
        </div>
      </section>

      {/* Key numbers */}
      <section aria-label={`Numbers for ${RANGE_LABEL[range]}`} className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
        {money ? (
          <>
            <Kpi icon={IndianRupee} label="Sales" value={k ? inr(k.sales) : "—"} change={k?.salesChange} sub={k ? `${inr(k.salesPrev)} before` : ""} />
            <Kpi icon={ShoppingBag} label="Orders" value={k ? String(k.orders) : "—"} change={k?.ordersChange} sub={k ? `${k.ordersPrev} before` : ""} />
            <Kpi icon={Receipt} label="Average order" value={k ? inr(k.aov) : "—"} sub={k ? `${k.itemsSold} items sold` : ""} />
            <Kpi icon={UserPlus} label="New customers" value={data ? String(data.newCustomers) : "—"} sub="Signed up" />
          </>
        ) : (
          <>
            <Kpi icon={ShoppingBag} label="Orders" value={k ? String(k.orders) : "—"} change={k?.ordersChange} sub={k ? `${k.ordersPrev} before` : ""} />
            <Kpi icon={Shirt} label="Items sold" value={k ? String(k.itemsSold) : "—"} sub={RANGE_LABEL[range]} />
            <Kpi icon={Boxes} label="Low stock" value={a ? String(a.lowStock) : "—"} sub="Sizes with 5 or less" />
            <Kpi icon={LifeBuoy} label="Open queries" value={a ? String(a.openQueries) : "—"} sub="Waiting for a reply" />
          </>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Chart */}
        <AdminCard className="lg:col-span-2 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-lg text-navy">{money ? "Sales" : "Orders"} · {RANGE_LABEL[range]}</h2>
              <p className="text-xs text-muted">Paid and Cash-on-Delivery orders. Unpaid and cancelled orders are not counted. India time.</p>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                {money ? (
                  <AreaChart data={data.stats.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#354275" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#354275" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E8DFCC" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6280" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B6280" }} tickLine={false} axisLine={false} width={52} tickFormatter={inrShort} />
                    <Tooltip
                      formatter={(v: any, key: any) => (key === "sales" ? [inr(Number(v)), "Sales"] : [v, "Orders"])}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E8DFCC", fontSize: 13 }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#354275" strokeWidth={2.5} fill="url(#salesFill)" />
                  </AreaChart>
                ) : (
                  <BarChart data={data.stats.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#E8DFCC" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B6280" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5B6280" }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip formatter={(v: any) => [v, "Orders"]} contentStyle={{ borderRadius: 12, border: "1px solid #E8DFCC", fontSize: 13 }} />
                    <Bar dataKey="orders" fill="#354275" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-lg bg-cream/60 animate-pulse" />
            )}
          </div>
        </AdminCard>

        {/* Payment + status */}
        <div className="space-y-4 sm:space-y-5">
          <AdminCard className="p-4 sm:p-5">
            <h2 className="font-display text-lg text-navy mb-3">How customers paid</h2>
            {data ? <PaymentSplit p={data.stats.payment} money={money} /> : <div className="h-16 rounded-lg bg-cream/60 animate-pulse" />}
          </AdminCard>
          <AdminCard className="p-4 sm:p-5">
            <h2 className="font-display text-lg text-navy mb-3">Orders by status</h2>
            {data ? <StatusBreakdown counts={data.stats.statusCounts} /> : <div className="h-24 rounded-lg bg-cream/60 animate-pulse" />}
          </AdminCard>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Live feed */}
        <AdminCard className="p-4 sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg text-navy">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-doodle hover:underline">All orders</Link>
          </div>
          <ul className="divide-y divide-line">
            {(data?.feed ?? []).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.order_number}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-cream/60 -mx-2 px-2 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {o.order_number}
                      {o.payment_method === "cod" ? <span className="ml-1.5 text-[10px] font-bold text-warning">COD</span> : o.payment_status === "pending" ? <span className="ml-1.5 text-[10px] font-bold text-muted">UNPAID</span> : null}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {[o.customer, o.city].filter(Boolean).join(" · ") || "Guest"} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {o.total !== null && <p className="text-sm font-bold text-navy">{inr(o.total)}</p>}
                    <StatusPill label={STATUS_LABEL[o.status] ?? o.status} tone={STATUS_TONE[o.status] ?? "neutral"} />
                  </div>
                </Link>
              </li>
            ))}
            {data && data.feed.length === 0 && <li className="py-6 text-center text-sm text-muted">No orders yet.</li>}
          </ul>
        </AdminCard>

        {/* Best sellers */}
        <AdminCard className="p-4 sm:p-5">
          <h2 className="font-display text-lg text-navy mb-2">Best sellers · {RANGE_LABEL[range]}</h2>
          <ol className="space-y-2.5">
            {(data?.stats.topProducts ?? []).map((p, i) => {
              const max = data?.stats.topProducts[0]?.qty || 1;
              return (
                <li key={p.name}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-ink">
                      <span className="text-muted mr-1.5">{i + 1}.</span>
                      {p.name}
                    </span>
                    <span className="shrink-0 font-semibold text-navy">
                      {p.qty} pcs{money ? ` · ${inr(p.revenue)}` : ""}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-cream overflow-hidden">
                    <div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.max(6, (p.qty / max) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
            {data && data.stats.topProducts.length === 0 && <li className="py-6 text-center text-sm text-muted">No sales in this period yet.</li>}
          </ol>
        </AdminCard>

        {/* Low stock */}
        <AdminCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-lg text-navy">Running out</h2>
            <Link href="/admin/stock?filter=low" className="text-sm font-semibold text-doodle hover:underline">Update stock</Link>
          </div>
          <ul className="divide-y divide-line">
            {(data?.lowStock ?? []).map((v) => (
              <li key={v.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-navy truncate">{v.product}</p>
                  <p className="text-xs text-muted truncate">{[v.size, v.sku].filter(Boolean).join(" · ")}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold rounded-full px-2 py-1 ${v.stock <= 0 ? "bg-blush text-error" : "bg-butter text-warning"}`}>
                  {v.stock <= 0 ? "Sold out" : `${v.stock} left`}
                </span>
              </li>
            ))}
            {data && data.lowStock.length === 0 && <li className="py-6 text-center text-sm text-muted">All sizes are well stocked ✓</li>}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}

function ActionTile({ href, icon: Icon, label, hint, n, urgent }: { href: string; icon: any; label: string; hint: string; n?: number; urgent?: boolean }) {
  const has = (n ?? 0) > 0;
  return (
    <Link
      href={href}
      className={`rounded-xl border p-3 sm:p-3.5 flex items-center gap-3 transition-colors ${
        has ? (urgent ? "bg-blush/60 border-brand-red/30 hover:bg-blush" : "bg-butter/60 border-brand-yellow/50 hover:bg-butter") : "bg-white border-line hover:bg-cream"
      }`}
    >
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${has ? "bg-white" : "bg-cream"}`}>
        <Icon className={`w-[18px] h-[18px] ${has ? (urgent ? "text-action" : "text-warning") : "text-muted"}`} />
      </span>
      <span className="min-w-0">
        <span className={`block font-display text-xl leading-none ${has ? "text-navy" : "text-muted"}`}>{n ?? "–"}</span>
        <span className="block text-xs font-semibold text-ink truncate mt-1">{label}</span>
        <span className="block text-[11px] text-muted truncate">{hint}</span>
      </span>
    </Link>
  );
}

function Kpi({ icon: Icon, label, value, change, sub }: { icon: any; label: string; value: string; change?: number | null; sub?: string }) {
  const up = (change ?? 0) > 0;
  const down = (change ?? 0) < 0;
  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <span className="w-8 h-8 rounded-lg bg-sky flex items-center justify-center">
          <Icon className="w-4 h-4 text-doodle" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl sm:text-3xl text-navy tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change !== undefined && change !== null && (
          <span className={`inline-flex items-center gap-0.5 font-bold rounded-full px-1.5 py-0.5 ${up ? "bg-success/10 text-success" : down ? "bg-error/10 text-error" : "bg-cream text-muted"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : down ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
        {sub && <span className="text-muted truncate">{sub}</span>}
      </div>
    </AdminCard>
  );
}

function PaymentSplit({ p, money }: { p: DashboardStats["payment"]; money: boolean }) {
  const total = p.cod.orders + p.online.orders;
  const onlinePct = total ? Math.round((p.online.orders / total) * 100) : 0;
  if (!total) return <p className="text-sm text-muted">No sales in this period yet.</p>;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-cream" role="img" aria-label={`${onlinePct}% online, ${100 - onlinePct}% cash on delivery`}>
        <div className="bg-doodle" style={{ width: `${onlinePct}%` }} />
        <div className="bg-brand-yellow" style={{ width: `${100 - onlinePct}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-muted"><span className="w-2.5 h-2.5 rounded-full bg-doodle" /> Online</dt>
          <dd className="font-semibold text-navy">{p.online.orders} orders{money ? ` · ${inr(p.online.sales)}` : ""}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted"><span className="w-2.5 h-2.5 rounded-full bg-brand-yellow" /> Cash on delivery</dt>
          <dd className="font-semibold text-navy">{p.cod.orders} orders{money ? ` · ${inr(p.cod.sales)}` : ""}</dd>
        </div>
      </dl>
    </div>
  );
}

function StatusBreakdown({ counts }: { counts: Record<string, number> }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="text-sm text-muted">No orders in this period yet.</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map(([s, n]) => (
        <li key={s}>
          <Link href={`/admin/orders?status=${s}`} className="flex items-center justify-between text-sm hover:underline">
            <span className="text-ink">{STATUS_LABEL[s] ?? s}</span>
            <span className="font-semibold text-navy tabular-nums">{n}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
