import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import CmsList from "./CmsList";

export const dynamic = "force-dynamic";

export default async function AdminCMS() {
  const admin = createAdminClient();
  const [{ data: pages }, { data: faqs }, { data: badges }] = await Promise.all([
    admin.from("cms_pages").select("*").order("title"),
    admin.from("faqs").select("*").order("sort_order"),
    admin.from("trust_badges").select("*").order("sort_order"),
  ]);
  return <CmsList pages={pages ?? []} faqs={faqs ?? []} badges={badges ?? []} />;
}
