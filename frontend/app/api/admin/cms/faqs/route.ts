import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { pickEditable } from "@/lib/pick";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin("cms");
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const body = pickEditable("faqs", await req.json().catch(() => ({})));
  const admin = createAdminClient();
  const { data, error } = await admin.from("faqs").insert(body).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  refreshSite();
  return NextResponse.json({ ok: true, id: data.id });
}
