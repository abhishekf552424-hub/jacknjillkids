import { createAdminClient } from "@/lib/supabase/admin";
import SettingsClient from "./SettingsClient";
import { requireAdminPage } from "@/lib/admin-auth";
import { DEVELOPER_ONLY_SETTINGS } from "@/lib/admin-roles";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const { role } = await requireAdminPage("settings");
  const isDeveloper = role === "super_admin";
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("*");
  const map: Record<string, any> = {};
  (data ?? []).forEach((r: any) => {
    // Payment secrets and tracking codes never reach the owner's browser.
    if (!isDeveloper && DEVELOPER_ONLY_SETTINGS.has(r.key)) return;
    map[r.key] = r.value;
  });
  return <SettingsClient initial={map} isDeveloper={isDeveloper} />;
}
