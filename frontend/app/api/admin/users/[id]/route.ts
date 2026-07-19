import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

async function requireSuper() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p?.role === "super_admin" ? user : null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const patch: any = {};
  if (body.role) patch.role = body.role;
  if (body.is_active !== undefined) patch.is_active = !!body.is_active;
  if (body.full_name !== undefined) patch.full_name = body.full_name;
  const { error } = await admin.from("profiles").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === me.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_active: false, role: "customer" }).eq("id", id);
  return NextResponse.json({ ok: true });
}

// POST => reset password for another admin (sends Supabase recovery link)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("email").eq("id", id).maybeSingle();
  if (!profile?.email) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "recovery", email: profile.email });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const actionLink = link?.properties?.action_link;
  await sendEmail({
    to: profile.email,
    subject: "Reset your Jack & Jill admin password",
    html: `<p>A password reset was requested for your admin account. <a href="${actionLink}">Click here to set a new password</a>. Link expires shortly.</p>`,
  });
  return NextResponse.json({ ok: true });
}
