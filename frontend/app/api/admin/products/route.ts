import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { syncProductVariants } from "@/lib/product-variants";

async function requireAdmin() {
  return checkAdmin(["super_admin", "content_manager"]);
}

async function save(payload: any, productId?: string) {
  const admin = createAdminClient();
  const { product, images, variants, age_group_ids, category_ids, bundles } = payload;
  const record = {
    ...product,
    slug: product.slug || slugify(product.name),
    base_price: Number(product.base_price),
    mrp: Number(product.mrp),
    product_type: product.product_type || "simple",
    hsn_code: product.hsn_code || null,
    eligible_coupon_codes: Array.isArray(product.eligible_coupon_codes) ? product.eligible_coupon_codes : [],
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
  // Reset images + variants + age groups + bundles
  await admin.from("product_images").delete().eq("product_id", id!);
  if (images?.length) {
    await admin.from("product_images").insert(images.map((im: any, i: number) => ({ product_id: id, url: im.url, alt_text: im.alt_text, sort_order: i })));
  }
  const vs = await syncProductVariants(admin, id!, variants);
  if (vs.error) return { error: vs.error };
  await admin.from("product_age_groups").delete().eq("product_id", id!);
  if (age_group_ids?.length) {
    await admin.from("product_age_groups").insert(age_group_ids.map((a: string) => ({ product_id: id, age_group_id: a })));
  }
  await admin.from("product_categories").delete().eq("product_id", id!);
  if (category_ids?.length) {
    await admin.from("product_categories").insert(category_ids.map((c: string) => ({ product_id: id, category_id: c })));
  }
  await admin.from("product_bundles").delete().eq("bundle_product_id", id!);
  if (record.product_type === "combo" && Array.isArray(bundles) && bundles.length) {
    await admin.from("product_bundles").insert(bundles.filter((b: any) => b.child_product_id).map((b: any, i: number) => ({
      bundle_product_id: id,
      child_product_id: b.child_product_id,
      child_variant_id: b.child_variant_id || null,
      quantity: Number(b.quantity) || 1,
      sort_order: i,
    })));
  }

  // Notify anyone waiting on now-in-stock variants (back-in-stock)
  try {
    const { data: nowInStock } = await admin.from("product_variants").select("id").eq("product_id", id!).gt("stock_qty", 0);
    if (nowInStock?.length) {
      const ids = nowInStock.map((v: any) => v.id);
      const { data: waiting } = await admin.from("stock_notifications").select("id, email, product_variant_id").in("product_variant_id", ids).is("notified_at", null);
      if (waiting?.length) {
        // Fire-and-forget in the background
        import("@/lib/resend").then(async ({ sendEmail }) => {
          for (const row of waiting) {
            await sendEmail({ to: row.email, subject: "Good news \u2014 it's back in stock!", html: `<p>The item you asked about is back in stock. <a href=\"${SITE_URL}/product/${(product?.slug || record.slug)}\">Shop now</a>.</p>` }).catch(() => {});
          }
          await admin.from("stock_notifications").update({ notified_at: new Date().toISOString() }).in("id", waiting.map((w: any) => w.id));
        });
      }
    }
  } catch {}

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
