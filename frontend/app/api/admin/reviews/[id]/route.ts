import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
async function requireAdmin() {
  const s = await createClient(); const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p && p.role !== "customer" ? user : null;
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const { is_approved } = await req.json();
  const admin = createAdminClient();
  await admin.from("reviews").update({ is_approved }).eq("id", id);
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("reviews").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
