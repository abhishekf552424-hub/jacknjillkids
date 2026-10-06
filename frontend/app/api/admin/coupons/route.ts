import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { pickEditable } from "@/lib/pick";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin("coupons");
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const body = pickEditable("coupons", await req.json().catch(() => ({})));
  if (body.code !== undefined) {
    body.code = String(body.code).trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,40}$/.test(body.code as string)) return NextResponse.json({ ok: false, error: "Coupon code: use 2–40 letters, numbers or dashes" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.from("coupons").insert(body).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  refreshSite();
  return NextResponse.json({ ok: true, id: data.id });
}
