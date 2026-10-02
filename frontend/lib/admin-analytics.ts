/**
 * Dashboard numbers, computed from raw order rows. Pure functions (no
 * database calls) so they are unit-tested in tests/admin.test.ts.
 *
 * Rules:
 *  - A "sale" is an order that is paid online or is Cash on Delivery, and is
 *    not cancelled or refunded. Unpaid online orders are not sales.
 *  - Days and hours are in India time (IST), whatever the server time zone.
 */

export type RangeKey = "today" | "7d" | "30d" | "90d";
export const RANGE_KEYS: RangeKey[] = ["today", "7d", "30d", "90d"];
export const RANGE_LABEL: Record<RangeKey, string> = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days" };

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

export type OrderRow = {
  id: string;
  order_number?: string;
  total: number | string | null;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  items?: { product_name: string | null; quantity: number | null; price_at_purchase: number | string | null }[] | null;
};

export function isSale(o: Pick<OrderRow, "status" | "payment_status">): boolean {
  if (o.status === "cancelled" || o.status === "refunded") return false;
  return o.payment_status === "paid" || o.payment_status === "cod";
}

/** Start of the IST calendar day containing `d`, as a real instant. */
export function istDayStart(d: Date): Date {
  const shifted = d.getTime() + IST_OFFSET_MS;
  return new Date(shifted - (shifted % DAY_MS) - IST_OFFSET_MS);
}

export type RangeWindow = { key: RangeKey; from: Date; to: Date; prevFrom: Date; bucket: "hour" | "day"; days: number };

export function rangeWindow(key: RangeKey, now = new Date()): RangeWindow {
  const today = istDayStart(now);
  const days = key === "today" ? 1 : key === "7d" ? 7 : key === "30d" ? 30 : 90;
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  const to = now;
  const prevFrom = new Date(from.getTime() - days * DAY_MS);
  return { key, from, to, prevFrom, bucket: key === "today" ? "hour" : "day", days };
}

function istParts(iso: string | Date) {
  const t = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), h: t.getUTCHours() };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function bucketKey(iso: string | Date, bucket: "hour" | "day"): string {
  const p = istParts(iso);
  if (bucket === "hour") return String(p.h).padStart(2, "0");
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export type SeriesPoint = { key: string; label: string; sales: number; orders: number };

export function emptySeries(w: RangeWindow): SeriesPoint[] {
  if (w.bucket === "hour") {
    return Array.from({ length: 24 }, (_, h) => {
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      return { key: String(h).padStart(2, "0"), label, sales: 0, orders: 0 };
    });
  }
  const out: SeriesPoint[] = [];
  for (let i = 0; i < w.days; i++) {
    const t = new Date(w.from.getTime() + i * DAY_MS + 12 * 3600_000);
    const p = istParts(t);
    out.push({ key: bucketKey(t, "day"), label: `${p.d} ${MONTHS[p.m]}`, sales: 0, orders: 0 });
  }
  return out;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export function pctChange(now: number, before: number): number | null {
  if (!before) return now ? null : 0;
  return Math.round(((now - before) / before) * 1000) / 10;
}

export type DashboardStats = {
  kpis: { sales: number; orders: number; aov: number; itemsSold: number; salesPrev: number; ordersPrev: number; salesChange: number | null; ordersChange: number | null };
  series: SeriesPoint[];
  statusCounts: Record<string, number>;
  payment: { cod: { orders: number; sales: number }; online: { orders: number; sales: number } };
  topProducts: { name: string; qty: number; revenue: number }[];
};

export function computeDashboard(w: RangeWindow, current: OrderRow[], previous: OrderRow[]): DashboardStats {
  const series = emptySeries(w);
  const byKey = new Map(series.map((p) => [p.key, p]));
  const statusCounts: Record<string, number> = {};
  const payment = { cod: { orders: 0, sales: 0 }, online: { orders: 0, sales: 0 } };
  const products = new Map<string, { name: string; qty: number; revenue: number }>();
  let sales = 0;
  let orders = 0;
  let itemsSold = 0;

  for (const o of current) {
    const at = new Date(o.created_at).getTime();
    if (at < w.from.getTime() || at > w.to.getTime()) continue;
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    if (!isSale(o)) continue;
    const total = num(o.total);
    sales += total;
    orders += 1;
    const pt = byKey.get(bucketKey(o.created_at, w.bucket));
    if (pt) {
      pt.sales += total;
      pt.orders += 1;
    }
    const bucket = o.payment_method === "cod" ? payment.cod : payment.online;
    bucket.orders += 1;
    bucket.sales += total;
    for (const it of o.items ?? []) {
      const qty = num(it.quantity);
      const name = (it.product_name || "Unnamed product").trim();
      const row = products.get(name) ?? { name, qty: 0, revenue: 0 };
      row.qty += qty;
      row.revenue += qty * num(it.price_at_purchase);
      products.set(name, row);
      itemsSold += qty;
    }
  }

  let salesPrev = 0;
  let ordersPrev = 0;
  for (const o of previous) {
    const at = new Date(o.created_at).getTime();
    if (at < w.prevFrom.getTime() || at >= w.from.getTime()) continue;
    if (!isSale(o)) continue;
    salesPrev += num(o.total);
    ordersPrev += 1;
  }

  for (const p of series) p.sales = round2(p.sales);
  payment.cod.sales = round2(payment.cod.sales);
  payment.online.sales = round2(payment.online.sales);

  return {
    kpis: {
      sales: round2(sales),
      orders,
      aov: orders ? round2(sales / orders) : 0,
      itemsSold,
      salesPrev: round2(salesPrev),
      ordersPrev,
      salesChange: pctChange(sales, salesPrev),
      ordersChange: pctChange(orders, ordersPrev),
    },
    series,
    statusCounts,
    payment,
    topProducts: [...products.values()]
      .map((p) => ({ ...p, revenue: round2(p.revenue) }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 6),
  };
}

/** Removes every money figure, for staff accounts. */
export function withoutMoney(s: DashboardStats): DashboardStats {
  return {
    ...s,
    kpis: { ...s.kpis, sales: 0, aov: 0, salesPrev: 0, salesChange: null },
    series: s.series.map((p) => ({ ...p, sales: 0 })),
    payment: { cod: { ...s.payment.cod, sales: 0 }, online: { ...s.payment.online, sales: 0 } },
    topProducts: s.topProducts.map((p) => ({ ...p, revenue: 0 })),
  };
}
