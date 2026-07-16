import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function NewOrEditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const admin = createAdminClient();
  const [{ data: cats }, { data: ages }] = await Promise.all([
    admin.from("categories").select("id, name, parent_id").order("sort_order"),
    admin.from("age_groups").select("id, label").order("sort_order"),
  ]);
  let product: any = null;
  let images: any[] = [];
  let variants: any[] = [];
  let productAges: string[] = [];
  if (!isNew) {
    const { data: p } = await admin.from("products").select("*").eq("id", id).maybeSingle();
    if (p) {
      product = p;
      const [{ data: imgs }, { data: vs }, { data: pa }] = await Promise.all([
        admin.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        admin.from("product_variants").select("*").eq("product_id", id),
        admin.from("product_age_groups").select("age_group_id").eq("product_id", id),
      ]);
      images = imgs ?? [];
      variants = vs ?? [];
      productAges = (pa ?? []).map((r: any) => r.age_group_id);
    }
  }
  return <ProductForm categories={cats ?? []} ageGroups={ages ?? []} product={product} images={images} variants={variants} productAges={productAges} />;
}
