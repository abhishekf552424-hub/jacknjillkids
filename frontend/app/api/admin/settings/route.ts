import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { DEVELOPER_ONLY_SETTINGS } from "@/lib/admin-roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearRazorpayCache } from "@/lib/settings";

async function requireSettingsAccess() {
  return checkAdmin("settings");
}

export async function POST(req: Request) {
  const g = await requireSettingsAccess();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { key, value } = await req.json().catch(() => ({}));
  if (typeof key !== "string" || !/^[a-z_]{2,40}$/.test(key) || value === undefined) {
    return NextResponse.json({ ok: false, error: "Invalid setting" }, { status: 400 });
  }
  if (DEVELOPER_ONLY_SETTINGS.has(key) && g.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "Only the developer can change this setting" }, { status: 403 });
  }
  const admin = createAdminClient();
  await admin.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (key === "razorpay") clearRazorpayCache();
  return NextResponse.json({ ok: true });
}
