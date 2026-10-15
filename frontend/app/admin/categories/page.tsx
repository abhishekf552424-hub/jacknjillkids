import { createAdminClient } from "@/lib/supabase/admin";
import CategoriesClient from "./CategoriesClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdminPage("categories");
  const admin = createAdminClient();
  const [{ data }, { data: primary }, { data: extra }] = await Promise.all([
    admin.from("categories").select("*").order("sort_order"),
    admin.from("products").select("id, category_id").neq("status", "archived"),
    admin.from("product_categories").select("product_id, category_id"),
  ]);
  // How many products sit directly in each category (primary or extra), counted once each.
  const sets = new Map<string, Set<string>>();
  const add = (cid: string | null, pid: string) => {
    if (!cid) return;
    if (!sets.has(cid)) sets.set(cid, new Set());
    sets.get(cid)!.add(pid);
  };
  const live = new Set((primary ?? []).map((p: any) => p.id));
  (primary ?? []).forEach((p: any) => add(p.category_id, p.id));
  (extra ?? []).forEach((r: any) => live.has(r.product_id) && add(r.category_id, r.product_id));
  const counts = Object.fromEntries([...sets].map(([k, v]) => [k, v.size]));
  return <CategoriesClient initial={data ?? []} productCounts={counts} />;
}
