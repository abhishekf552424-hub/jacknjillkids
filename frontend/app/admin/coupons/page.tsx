import { createAdminClient } from "@/lib/supabase/admin";
import CouponsClient from "./CouponsClient";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  await requireAdminPage("coupons");
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponsClient initial={data ?? []} />;
}
