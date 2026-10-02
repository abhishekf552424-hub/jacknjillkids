import { createAdminClient } from "@/lib/supabase/admin";
import HomepageClient from "./HomepageClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminHomepage() {
  await requireAdminPage("homepage");
  const admin = createAdminClient();
  const [{ data: sections }, { data: prods }, { data: promoRow }] = await Promise.all([
    admin.from("homepage_sections").select("*").order("sort_order"),
    admin.from("products").select("id, name, slug").eq("status", "active").order("name").limit(300),
    admin.from("settings").select("value").eq("key", "promo_popup").maybeSingle(),
  ]);
  return <HomepageClient initial={sections ?? []} products={prods ?? []} promo={promoRow?.value || null} />;
}
