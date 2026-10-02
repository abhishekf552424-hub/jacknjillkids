import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { canAccess } from "@/lib/admin-roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Small numbers for the sidebar badges ("3 new orders"). */
export async function GET() {
  const g = await checkAdmin("dashboard");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const admin = createAdminClient();
  const moderate = canAccess(g.role, "reviews");
  const [orders, queries, returns, reviews, stock] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).in("status", ["placed", "confirmed", "packed"]).in("payment_status", ["paid", "cod"]),
    admin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    admin.from("returns").select("id", { count: "exact", head: true }).eq("status", "requested"),
    moderate ? admin.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false) : Promise.resolve({ count: 0 }),
    admin.from("product_variants").select("id", { count: "exact", head: true }).lte("stock_qty", 0),
  ]);
  return NextResponse.json({
    orders: orders.count ?? 0,
    support: queries.count ?? 0,
    returns: returns.count ?? 0,
    reviews: reviews.count ?? 0,
    stock: stock.count ?? 0,
  });
}
