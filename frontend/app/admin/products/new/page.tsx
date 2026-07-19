import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const admin = createAdminClient();
  const [{ data: cats }, { data: ages }, { data: coupons }, { data: others }] = await Promise.all([
    admin.from("categories").select("id, name, parent_id").order("sort_order"),
    admin.from("age_groups").select("id, label").order("sort_order"),
    admin.from("coupons").select("id, code, type, value").eq("is_active", true),
    admin.from("products").select("id, name, slug, base_price").eq("status", "active").order("name").limit(200),
  ]);
  return (
    <ProductForm
      categories={cats ?? []}
      ageGroups={ages ?? []}
      product={null}
      images={[]}
      variants={[]}
      productAges={[]}
      coupons={coupons ?? []}
      otherProducts={others ?? []}
      bundles={[]}
    />
  );
}
