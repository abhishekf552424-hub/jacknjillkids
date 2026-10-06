import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
async function requireAdmin() {
  const g = await checkAdmin("reviews");
  return "error" in g ? null : g.user;
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { is_approved } = await req.json().catch(() => ({}));
  if (typeof is_approved !== "boolean") return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("reviews").update({ is_approved }).eq("id", id);
  refreshSite();
  return NextResponse.json({ ok: true });
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("reviews").delete().eq("id", id);
  refreshSite();
  return NextResponse.json({ ok: true });
}
