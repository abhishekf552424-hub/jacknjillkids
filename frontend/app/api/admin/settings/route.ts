import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearRazorpayCache } from "@/lib/settings";

async function requireSuperAdmin() {
  return checkAdmin(["super_admin"]);
}

export async function POST(req: Request) {
  const g = await requireSuperAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { key, value } = await req.json();
  const admin = createAdminClient();
  await admin.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (key === "razorpay") clearRazorpayCache();
  return NextResponse.json({ ok: true });
}
