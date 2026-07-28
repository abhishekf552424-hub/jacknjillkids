import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "content_manager"].includes(p.role)) return { error: "Forbidden", status: 403 };
  return { user };
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
