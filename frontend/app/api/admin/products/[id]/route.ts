import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { syncProductVariants } from "@/lib/product-variants";

async function requireAdmin() {
  return checkAdmin("products");
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
  const vs = await syncProductVariants(admin, id, body.variants);
  if (vs.error) return NextResponse.json({ ok: false, error: vs.error }, { status: 400 });
  await admin.from("product_age_groups").delete().eq("product_id", id);
  if (body.age_group_ids?.length) {
    await admin.from("product_age_groups").insert(body.age_group_ids.map((a: string) => ({ product_id: id, age_group_id: a })));
  }
  await admin.from("product_categories").delete().eq("product_id", id);
  if (body.category_ids?.length) {
    await admin.from("product_categories").insert(body.category_ids.map((c: string) => ({ product_id: id, category_id: c })));
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
