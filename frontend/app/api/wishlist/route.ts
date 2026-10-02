import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Saved products for the signed-in customer. Row Level Security makes sure a
 * customer can only ever read or change their own list. Guests keep their list
 * in the browser; it is merged here when they log in.
 */
async function me() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function listIds(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", userId).order("created_at", { ascending: false }).limit(500);
  return (data ?? []).map((r: any) => r.product_id as string);
}

export async function GET() {
  const { supabase, user } = await me();
  if (!user) return NextResponse.json({ ids: [], signedIn: false });
  return NextResponse.json({ ids: await listIds(supabase, user.id), signedIn: true });
}

const Add = z.object({ product_ids: z.array(z.string().uuid()).min(1).max(200) });

export async function POST(req: Request) {
  const { supabase, user } = await me();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const parsed = Add.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid products" }, { status: 400 });

  // Only real, visible products.
  const { data: real } = await supabase.from("products").select("id").in("id", parsed.data.product_ids).in("status", ["active", "out_of_stock"]);
  const rows = (real ?? []).map((p: any) => ({ user_id: user.id, product_id: p.id }));
  if (rows.length) {
    const { error } = await supabase.from("wishlists").upsert(rows, { onConflict: "user_id,product_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ids: await listIds(supabase, user.id), signedIn: true });
}

export async function DELETE(req: Request) {
  const { supabase, user } = await me();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("product_id") || "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const { error } = await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", id);
  if (error) return NextResponse.json({ error: "Could not remove" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
