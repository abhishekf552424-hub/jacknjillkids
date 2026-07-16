import { createAdminClient } from "@/lib/supabase/admin";
import HomepageClient from "./HomepageClient";

export const dynamic = "force-dynamic";

export default async function AdminHomepage() {
  const admin = createAdminClient();
  const { data } = await admin.from("homepage_sections").select("*").order("sort_order");
  return <HomepageClient initial={data ?? []} />;
}
