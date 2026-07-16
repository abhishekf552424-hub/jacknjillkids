import { createAdminClient } from "@/lib/supabase/admin";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("*");
  const map: Record<string, any> = {};
  (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
  return <SettingsClient initial={map} />;
}
