import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Body = z.object({
  order_id: z.string().uuid(),
  current_variant_id: z.string().uuid(),
  new_variant_id: z.string().uuid(),
  reason: z.string().trim().max(300).optional(),
});

// Customer asks to swap a delivered item for another size of the SAME product.
export async function POST(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please choose the item and the new size" }, { status: 400 });
  const { order_id, current_variant_id, new_variant_id, reason } = parsed.data;
  if (current_variant_id === new_variant_id) return NextResponse.json({ error: "Please choose a different size" }, { status: 400 });

  const admin = createAdminClient();
  if (!(await allow(`exchange:${user.id}`, 10, 3600, admin))) return NextResponse.json({ error: "Too many requests. Please try later." }, { status: 429 });

  const { data: order } = await admin.from("orders").select("id, user_id, status, delivered_at, updated_at, created_at").eq("id", order_id).maybeSingle();
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "delivered") return NextResponse.json({ error: "Only delivered orders can be exchanged" }, { status: 400 });

  // Exchange window counts from delivery
  const { data: setRow } = await admin.from("settings").select("value").eq("key", "returns").maybeSingle();
  const windowDays = Number((setRow?.value as any)?.exchange_window_days) || 7;
  const deliveredAt = new Date(order.delivered_at || order.updated_at || order.created_at).getTime();
  if (Date.now() - deliveredAt > windowDays * 86400_000) return NextResponse.json({ error: `The ${windowDays}-day exchange window has passed` }, { status: 400 });

  // The item must really be in this order …
  const { data: item } = await admin.from("order_items").select("id, variant_id, price_at_purchase").eq("order_id", order.id).eq("variant_id", current_variant_id).maybeSingle();
  if (!item) return NextResponse.json({ error: "That item isn't in this order" }, { status: 400 });

  // … and the new size must be the same product, in stock.
  const { data: vs } = await admin.from("product_variants").select("id, product_id, stock_qty").in("id", [current_variant_id, new_variant_id]);
  const cur = vs?.find((v) => v.id === current_variant_id);
  const nv = vs?.find((v) => v.id === new_variant_id);
  if (!cur || !nv || cur.product_id !== nv.product_id) return NextResponse.json({ error: "You can exchange only for another size of the same product" }, { status: 400 });
  if ((nv.stock_qty ?? 0) < 1) return NextResponse.json({ error: "Chosen size is out of stock" }, { status: 400 });

  // One open request per item
  const { count: open } = await admin
    .from("returns")
    .select("id", { count: "exact", head: true })
    .eq("order_item_id", item.id)
    .in("status", ["requested", "in_progress", "approved"]);
  if ((open ?? 0) > 0) return NextResponse.json({ error: "You've already asked to exchange this item" }, { status: 409 });

  const { error } = await admin.from("returns").insert({
    order_id: order.id,
    order_item_id: item.id,
    user_id: user.id,
    variant_id: current_variant_id,
    exchange_variant_id: new_variant_id,
    exchange_type: "size_exchange",
    type: "size_exchange",
    reason: reason || "Size doesn't fit",
    status: "requested",
  });
  if (error) {
    console.error("[returns/exchange]", error.message);
    return NextResponse.json({ error: "Could not save your request. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
