import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearRazorpayCache } from "@/lib/settings";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (p?.role !== "super_admin") return { error: "Forbidden", status: 403 };
  return { user };
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
