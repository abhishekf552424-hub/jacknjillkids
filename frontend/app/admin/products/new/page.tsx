import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "./ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const admin = createAdminClient();
  const [{ data: cats }, { data: ages }] = await Promise.all([
    admin.from("categories").select("id, name, parent_id").order("sort_order"),
    admin.from("age_groups").select("id, label").order("sort_order"),
  ]);
  return <ProductForm categories={cats ?? []} ageGroups={ages ?? []} product={null} images={[]} variants={[]} productAges={[]} />;
}
