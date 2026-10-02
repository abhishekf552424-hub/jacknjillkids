import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin(["super_admin", "content_manager"]);
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  
  const { pincodes } = await req.json();
  if (!Array.isArray(pincodes)) return NextResponse.json({ ok: false, error: "Invalid format" }, { status: 400 });
  
  const admin = createAdminClient();
  const { error } = await admin.from("pincodes").upsert(pincodes);
  
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, count: pincodes.length });
}
