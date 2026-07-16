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

async function save(payload: any, productId?: string) {
  const admin = createAdminClient();
  const { product, images, variants, age_group_ids } = payload;
  const record = {
    ...product,
    slug: product.slug || slugify(product.name),
    base_price: Number(product.base_price),
    mrp: Number(product.mrp),
  };
  let id = productId;
  if (id) {
    const { error } = await admin.from("products").update(record).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin.from("products").insert(record).select().single();
    if (error) return { error: error.message };
    id = data.id;
  }
  // Reset images + variants + age groups
  await admin.from("product_images").delete().eq("product_id", id!);
  if (images?.length) {
    await admin.from("product_images").insert(images.map((im: any, i: number) => ({ product_id: id, url: im.url, alt_text: im.alt_text, sort_order: i })));
  }
  await admin.from("product_variants").delete().eq("product_id", id!);
  if (variants?.length) {
    await admin.from("product_variants").insert(variants.filter((v: any) => v.sku || v.size || v.color).map((v: any) => ({
      product_id: id,
      size: v.size || null,
      color: v.color || null,
      color_hex: v.color_hex || null,
      sku: v.sku || null,
      stock_qty: Number(v.stock_qty) || 0,
      price_override: v.price_override ? Number(v.price_override) : null,
    })));
  }
  await admin.from("product_age_groups").delete().eq("product_id", id!);
  if (age_group_ids?.length) {
    await admin.from("product_age_groups").insert(age_group_ids.map((a: string) => ({ product_id: id, age_group_id: a })));
  }
  return { id };
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const body = await req.json();
  const res = await save(body);
  if ("error" in res) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: res.id });
}

export async function PUT(req: Request) {
  return NextResponse.json({ ok: false, error: "Use /api/admin/products/[id] for updates" }, { status: 400 });
}
