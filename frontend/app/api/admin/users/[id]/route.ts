import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { canAssign, canManage } from "@/lib/admin-team";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { esc } from "@/lib/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadTarget(id: string) {
  const g = await checkAdmin("team");
  if ("error" in g) return { res: NextResponse.json({ error: g.error }, { status: g.status }) };
  const admin = createAdminClient();
  const { data: target } = await admin.from("profiles").select("id, email, role").eq("id", id).maybeSingle();
  if (!target) return { res: NextResponse.json({ error: "Team member not found" }, { status: 404 }) };
  const why = canManage({ id: g.user.id, role: g.role }, target);
  if (why) return { res: NextResponse.json({ error: why }, { status: 403 }) };
  return { g, admin, target };
}

/** Change role, name or access on/off. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await loadTarget(id);
  if ("res" in t) return t.res;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!canAssign(t.g.role, body.role)) return NextResponse.json({ error: "You can't give this role" }, { status: 403 });
    patch.role = body.role;
  }
  if (body.is_active !== undefined) patch.is_active = !!body.is_active;
  if (typeof body.full_name === "string") patch.full_name = body.full_name.trim().slice(0, 80);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  const { error } = await t.admin.from("profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Remove from the team (the account stays, admin access is gone). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await loadTarget(id);
  if ("res" in t) return t.res;
  const { error } = await t.admin.from("profiles").update({ role: "customer", is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Email a password-reset link. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await loadTarget(id);
  if ("res" in t) return t.res;
  if (!t.target.email) return NextResponse.json({ error: "No email on this account" }, { status: 400 });
  const { data: link, error } = await t.admin.auth.admin.generateLink({ type: "recovery", email: t.target.email });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const sent = await sendEmail({
    to: t.target.email,
    subject: "Reset your Jack & Jill admin password",
    html: `<p>A password reset was requested for your admin account. <a href="${esc(link?.properties?.action_link || "")}">Set a new password</a>. The link expires soon.</p>`,
  });
  if (!sent.ok) return NextResponse.json({ error: "Email could not be sent. Check the Resend settings." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
