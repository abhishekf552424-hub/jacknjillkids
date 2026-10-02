import { createAdminClient } from "@/lib/supabase/admin";
import CustomersClient from "./CustomersClient";
import ClubMembers from "./ClubMembers";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  await requireAdminPage("customers");
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  const ids = (profiles ?? []).map((p: any) => p.id);
  const { data: orders } = ids.length ? await admin.from("orders").select("user_id, total").in("user_id", ids) : { data: [] };
  const spendByUser: Record<string, number> = {};
  const countByUser: Record<string, number> = {};
  (orders ?? []).forEach((o: any) => {
    spendByUser[o.user_id] = (spendByUser[o.user_id] ?? 0) + Number(o.total);
    countByUser[o.user_id] = (countByUser[o.user_id] ?? 0) + 1;
  });

  const rows = (profiles ?? []).map((p: any) => ({
    ...p,
    order_count: countByUser[p.id] ?? 0,
    total_spend: spendByUser[p.id] ?? 0,
  }));

  const { data: club, count: clubCount } = await admin.from("club_members").select("phone, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(500);

  return (
    <>
      <CustomersClient initial={rows} />
      <ClubMembers rows={(club ?? []) as { phone: string; created_at: string }[]} total={clubCount ?? 0} />
    </>
  );
}
