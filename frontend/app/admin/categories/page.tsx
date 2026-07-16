import { createAdminClient } from "@/lib/supabase/admin";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("*").order("sort_order");
  return <CategoriesClient initial={data ?? []} />;
}
