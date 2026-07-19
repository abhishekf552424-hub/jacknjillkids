import { createAdminClient } from "@/lib/supabase/admin";
import SupportClient from "./SupportClient";
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from("support_tickets")
    .select("*, msgs:support_ticket_messages(id, body, author_role, created_at)")
    .order("created_at", { ascending: false });
  return <SupportClient initial={tickets ?? []} />;
}
