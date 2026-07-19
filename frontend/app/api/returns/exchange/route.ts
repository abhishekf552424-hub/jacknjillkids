import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Customer submits a size-exchange request.
// Body: { order_id, order_item_id, current_variant_id, new_variant_id, reason }
export async function POST(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const { order_id, current_variant_id, new_variant_id, reason } = await req.json();
  if (!order_id || !current_variant_id || !new_variant_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("id, user_id, status, delivered_at, created_at").eq("id", order_id).maybeSingle();
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "delivered") return NextResponse.json({ error: "Only delivered orders can be exchanged" }, { status: 400 });

  // Check window
  const { data: setRow } = await admin.from("settings").select("value").eq("key", "returns").maybeSingle();
  const windowDays = (setRow?.value?.exchange_window_days as number | undefined) ?? 7;
  const deliveredAt = new Date(order.delivered_at || order.created_at).getTime();
  if (Date.now() - deliveredAt > windowDays * 86400_000) return NextResponse.json({ error: `Exchange window (${windowDays} days) has passed` }, { status: 400 });

  // Check new variant has stock
  const { data: nv } = await admin.from("product_variants").select("stock_qty").eq("id", new_variant_id).maybeSingle();
  if (!nv || (nv.stock_qty ?? 0) < 1) return NextResponse.json({ error: "Chosen size is out of stock" }, { status: 400 });

  const { error } = await admin.from("returns").insert({
    order_id, user_id: user.id, variant_id: current_variant_id,
    exchange_variant_id: new_variant_id, exchange_type: "size_exchange",
    type: "size_exchange", reason: reason || "Size doesn't fit", status: "requested",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
