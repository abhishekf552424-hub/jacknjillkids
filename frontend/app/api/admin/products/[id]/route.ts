import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "content_manager"].includes(p.role)) return { error: "Forbidden", status: 403 };
  return { user };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const record = {
    ...body.product,
    slug: body.product.slug || slugify(body.product.name),
    base_price: Number(body.product.base_price),
    mrp: Number(body.product.mrp),
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("products").update(record).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await admin.from("product_images").delete().eq("product_id", id);
  if (body.images?.length) {
    await admin.from("product_images").insert(body.images.map((im: any, i: number) => ({ product_id: id, url: im.url, alt_text: im.alt_text, sort_order: i })));
  }
  await admin.from("product_variants").delete().eq("product_id", id);
  if (body.variants?.length) {
    await admin.from("product_variants").insert(body.variants.filter((v: any) => v.sku || v.size || v.color).map((v: any) => ({
      product_id: id,
      size: v.size || null,
      color: v.color || null,
      color_hex: v.color_hex || null,
      sku: v.sku || null,
      stock_qty: Number(v.stock_qty) || 0,
      price_override: v.price_override ? Number(v.price_override) : null,
    })));
  }
  await admin.from("product_age_groups").delete().eq("product_id", id);
  if (body.age_group_ids?.length) {
    await admin.from("product_age_groups").insert(body.age_group_ids.map((a: string) => ({ product_id: id, age_group_id: a })));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("products").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
