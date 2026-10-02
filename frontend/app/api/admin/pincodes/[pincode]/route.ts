import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin(["super_admin", "content_manager"]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ pincode: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  
  const { pincode } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("pincodes").delete().eq("pincode", pincode);
  
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
