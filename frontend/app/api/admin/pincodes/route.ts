import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin(["super_admin", "content_manager"]);
}

export async function GET() {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const admin = createAdminClient();
  const { data, error } = await admin.from("pincodes").select("*").order("pincode");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  
  const body = await req.json();
  const admin = createAdminClient();
  
  const { error } = await admin.from("pincodes").upsert({
    pincode: body.pincode,
    city: body.city,
    state: body.state,
    is_serviceable: body.is_serviceable ?? true,
    cod_available: body.cod_available ?? true,
    est_delivery_days: body.est_delivery_days ?? 5,
  });
  
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
