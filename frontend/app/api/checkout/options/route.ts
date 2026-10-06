import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Which payment choices checkout should offer (Admin → Settings: COD / Razorpay). */
export async function GET() {
  const admin = createAdminClient();
  const [{ data: codSetting }, cfg] = await Promise.all([
    admin.from("settings").select("value").eq("key", "cod").maybeSingle(),
    getRazorpayConfig(),
  ]);
  const cod = (codSetting?.value as any)?.enabled !== false;
  const online = Boolean(cfg.enabled && cfg.key_id && cfg.key_secret && !cfg.key_id.startsWith("rzp_test_placeholder"));
  return NextResponse.json({ cod, online }, { headers: { "Cache-Control": "no-store" } });
}
