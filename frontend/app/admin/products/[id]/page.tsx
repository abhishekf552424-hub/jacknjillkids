import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewOrEditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const admin = createAdminClient();
  const [{ data: cats }, { data: ages }, { data: coupons }, { data: others }] = await Promise.all([
    admin.from("categories").select("id, name, parent_id").order("sort_order"),
    admin.from("age_groups").select("id, label").order("sort_order"),
    admin.from("coupons").select("id, code, type, value").eq("is_active", true),
    admin.from("products").select("id, name, slug, base_price").eq("status", "active").order("name").limit(200),
  ]);

  let product: any = null;
  let images: any[] = [];
  let variants: any[] = [];
  let productAges: string[] = [];
  let bundles: any[] = [];
  if (!isNew) {
    const { data: p } = await admin.from("products").select("*").eq("id", id).maybeSingle();
    if (p) {
      product = p;
      const [{ data: imgs }, { data: vs }, { data: pa }, { data: bnd }] = await Promise.all([
        admin.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        admin.from("product_variants").select("*").eq("product_id", id),
        admin.from("product_age_groups").select("age_group_id").eq("product_id", id),
        admin.from("product_bundles").select("*").eq("bundle_product_id", id).order("sort_order"),
      ]);
      images = imgs ?? [];
      variants = vs ?? [];
      productAges = (pa ?? []).map((r: any) => r.age_group_id);
      bundles = bnd ?? [];
    }
  }
  return (
    <ProductForm
      categories={cats ?? []}
      ageGroups={ages ?? []}
      product={product}
      images={images}
      variants={variants}
      productAges={productAges}
      coupons={coupons ?? []}
      otherProducts={others ?? []}
      bundles={bundles}
    />
  );
}
