import { createAdminClient } from "@/lib/supabase/admin";
import ProductsListClient from "./ProductsListClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await requireAdminPage("products");
  const admin = createAdminClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, slug, base_price, mrp, price_min, price_max, status, is_featured, is_new_arrival, category_id, created_at, variants:product_variants(stock_qty)")
      .order("created_at", { ascending: false })
      .limit(500),
    admin.from("categories").select("id, name, parent_id, sort_order, is_active").order("sort_order"),
  ]);

  return <ProductsListClient initialProducts={products ?? []} categories={categories ?? []} />;
}
