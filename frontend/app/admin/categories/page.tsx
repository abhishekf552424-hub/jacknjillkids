import { createAdminClient } from "@/lib/supabase/admin";
import CategoriesClient from "./CategoriesClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPage(["super_admin", "content_manager"]);
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("*").order("sort_order");
  return <CategoriesClient initial={data ?? []} />;
}
