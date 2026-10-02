import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { canAccess } from "@/lib/admin-roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { RANGE_KEYS, computeDashboard, rangeWindow, withoutMoney, type OrderRow, type RangeKey } from "@/lib/admin-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOW_STOCK_AT = 5;
const PAGE = 1000;
const MAX_ROWS = 20_000;

/** Supabase returns at most 1000 rows per request, so read page by page. */
async function fetchAll<T>(make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await make(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function GET(req: Request) {
  const g = await checkAdmin("dashboard");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const showMoney = canAccess(g.role, "reports");

  const param = new URL(req.url).searchParams.get("range") as RangeKey | null;
  const key: RangeKey = param && RANGE_KEYS.includes(param) ? param : "today";
  const w = rangeWindow(key);
  const admin = createAdminClient();

  try {
    const [current, previous, recent, lowStock, toAction, queries, returns, reviews, newCustomers] = await Promise.all([
      fetchAll<OrderRow>((a, b) =>
        admin
          .from("orders")
          .select("id, total, status, payment_status, payment_method, created_at, items:order_items(product_name, quantity, price_at_purchase)")
          .gte("created_at", w.from.toISOString())
          .lte("created_at", w.to.toISOString())
          .order("created_at", { ascending: true })
          .range(a, b),
      ),
      fetchAll<OrderRow>((a, b) =>
        admin
          .from("orders")
          .select("id, total, status, payment_status, payment_method, created_at")
          .gte("created_at", w.prevFrom.toISOString())
          .lt("created_at", w.from.toISOString())
          .order("created_at", { ascending: true })
          .range(a, b),
      ),
      admin
        .from("orders")
        .select("id, order_number, total, status, payment_status, payment_method, created_at, shipping_address")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("product_variants")
        .select("id, sku, size, color, stock_qty, product:products!inner(id, name, status)")
        .lte("stock_qty", LOW_STOCK_AT)
        .eq("product.status", "active")
        .order("stock_qty", { ascending: true })
        .limit(500),
      admin
        .from("orders")
        .select("status")
        .in("status", ["placed", "confirmed", "packed"])
        .in("payment_status", ["paid", "cod"])
        .limit(1000),
      admin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      admin.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested"),
      showMoney
        ? admin.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false)
        : Promise.resolve({ count: 0 }),
      showMoney
        ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer").gte("created_at", w.from.toISOString())
        : Promise.resolve({ count: 0 }),
    ]);

    if (lowStock.error) throw new Error(lowStock.error.message);
    const lowRows = (lowStock.data ?? []) as any[];

    const stats = computeDashboard(w, current, previous);
    const pipeline = { placed: 0, confirmed: 0, packed: 0 };
    for (const o of (toAction.data ?? []) as { status: keyof typeof pipeline }[]) pipeline[o.status] += 1;

    const feed = ((recent.data ?? []) as any[]).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      total: showMoney ? Number(o.total) : null,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      created_at: o.created_at,
      customer: o.shipping_address?.full_name ?? null,
      city: o.shipping_address?.city ?? null,
    }));

    return NextResponse.json({
      range: key,
      from: w.from.toISOString(),
      to: w.to.toISOString(),
      showMoney,
      stats: showMoney ? stats : withoutMoney(stats),
      actions: {
        newOrders: pipeline.placed,
        toPack: pipeline.confirmed,
        toShip: pipeline.packed,
        openQueries: queries.count ?? 0,
        returnRequests: returns.count ?? 0,
        lowStock: lowRows.length,
        pendingReviews: reviews.count ?? 0,
      },
      newCustomers: newCustomers.count ?? 0,
      feed,
      lowStock: lowRows.slice(0, 6).map((v) => ({
        id: v.id,
        sku: v.sku,
        size: [v.size, v.color].filter(Boolean).join(" / ") || null,
        stock: v.stock_qty,
        product: Array.isArray(v.product) ? v.product[0]?.name : v.product?.name,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not load the dashboard" }, { status: 500 });
  }
}
