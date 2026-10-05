import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

async function requireAdmin() {
  const g = await checkAdmin("support");
  return "error" in g ? null : g.user;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!["open", "in_progress", "resolved", "closed"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("support_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true });
}
