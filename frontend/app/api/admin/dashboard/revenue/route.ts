import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from") || new Date(Date.now() - 7 * 86400_000).toISOString();
  const to = url.searchParams.get("to") || new Date().toISOString();

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, total, created_at, status")
    .gte("created_at", from)
    .lte("created_at", to)
    .not("status", "in", "(cancelled,failed)")
    .order("created_at", { ascending: true });

  const start = new Date(from);
  const end = new Date(to);
  const dayMs = 86400_000;
  const span = end.getTime() - start.getTime();
  const useHourly = span <= dayMs + 1000;
  // pre-fill buckets
  const buckets: Record<string, { revenue: number; orders: number }> = {};
  if (useHourly) {
    for (let h = 0; h < 24; h++) {
      const key = String(h).padStart(2, "0") + ":00";
      buckets[key] = { revenue: 0, orders: 0 };
    }
  } else {
    for (let t = new Date(start); t <= end; t = new Date(t.getTime() + dayMs)) {
      const key = t.toISOString().slice(0, 10);
      buckets[key] = { revenue: 0, orders: 0 };
    }
  }

  let totalRevenue = 0;
  let totalOrders = 0;
  for (const o of orders ?? []) {
    const d = new Date(o.created_at);
    const key = useHourly ? String(d.getHours()).padStart(2, "0") + ":00" : d.toISOString().slice(0, 10);
    if (!buckets[key]) buckets[key] = { revenue: 0, orders: 0 };
    buckets[key].revenue += Number(o.total || 0);
    buckets[key].orders += 1;
    totalRevenue += Number(o.total || 0);
    totalOrders += 1;
  }

  const rows = Object.entries(buckets).map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }));
  return NextResponse.json({ buckets: rows, revenue: totalRevenue, orders: totalOrders });
}
