import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import CmsList from "./CmsList";
import { requireAdminPage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCMS() {
  await requireAdminPage("cms");
  const admin = createAdminClient();
  const [{ data: pages }, { data: faqs }, { data: badges }] = await Promise.all([
    admin.from("cms_pages").select("*").order("title"),
    admin.from("faqs").select("*").order("sort_order"),
    admin.from("trust_badges").select("*").order("sort_order"),
  ]);
  return <CmsList pages={pages ?? []} faqs={faqs ?? []} badges={badges ?? []} />;
}
