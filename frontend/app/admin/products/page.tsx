import { createAdminClient } from "@/lib/supabase/admin";
import ProductsListClient from "./ProductsListClient";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const admin = createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, slug, base_price, mrp, status, is_featured, is_new_arrival, category_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("categories").select("id, name").order("name"),
  ]);

  return <ProductsListClient initialProducts={products ?? []} categories={categories ?? []} />;
}
