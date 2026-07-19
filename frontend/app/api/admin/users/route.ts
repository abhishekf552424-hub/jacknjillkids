import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

async function requireSuper() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p?.role === "super_admin" ? user : null;
}

export async function GET() {
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("role", ["super_admin", "order_manager", "content_manager"])
    .order("created_at", { ascending: true });
  const { data: invites } = await admin
    .from("admin_invites")
    .select("id, email, role, expires_at, accepted_at, created_at")
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return NextResponse.json({ admins: profiles || [], invites: invites || [] });
}

export async function POST(req: Request) {
  const me = await requireSuper();
  if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { email, role, full_name, password } = await req.json();
  if (!email || !role) return NextResponse.json({ error: "Email and role required" }, { status: 400 });
  if (!["super_admin", "order_manager", "content_manager"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const admin = createAdminClient();

  // If password provided → create user immediately
  if (password) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: full_name || email },
    });
    if (error && !String(error.message).toLowerCase().includes("already")) return NextResponse.json({ error: error.message }, { status: 400 });
    let userId = created?.user?.id;
    if (!userId) {
      const { data: list } = await admin.auth.admin.listUsers();
      userId = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    }
    if (!userId) return NextResponse.json({ error: "Could not resolve user" }, { status: 500 });
    await admin.from("profiles").upsert({ id: userId, email, full_name: full_name || email, role, is_active: true });
    await sendEmail({
      to: email,
      subject: `You've been added as ${role.replace(/_/g, " ")} on Jack & Jill`,
      html: `<p>Hi ${full_name || ""}, an admin account has been created for you on Jack &amp; Jill.</p><p>Login at <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/login">the admin panel</a> using this email and your password. You'll be prompted for a one-time code emailed to you on every login.</p>`,
    });
    return NextResponse.json({ ok: true, user_id: userId });
  }

  // Otherwise → send an invite email with a token
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
  await admin.from("admin_invites").upsert({ email, role, token, expires_at: expiresAt, invited_by: me.id }, { onConflict: "email" });
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/invite/${token}`;
  await sendEmail({
    to: email,
    subject: `You're invited to Jack & Jill admin (${role.replace(/_/g, " ")})`,
    html: `<p>Accept your admin invite: <a href="${link}">${link}</a></p><p>Expires in 7 days.</p>`,
  });
  return NextResponse.json({ ok: true, invited: true });
}
