import { createAdminClient } from "@/lib/supabase/admin";
import CouponsClient from "./CouponsClient";

export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  return <CouponsClient initial={data ?? []} />;
}
