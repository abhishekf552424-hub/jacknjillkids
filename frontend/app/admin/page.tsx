import { requireAdminPage } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import LiveDashboard from "./LiveDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { user } = await requireAdminPage("dashboard");
  const { data: me } = await createAdminClient().from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  return <LiveDashboard name={me?.full_name || user.email?.split("@")[0] || ""} />;
}
