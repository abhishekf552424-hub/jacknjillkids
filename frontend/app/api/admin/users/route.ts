import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE_URL } from "@/lib/site";
import { checkAdmin } from "@/lib/admin-auth";
import { ALL_ADMIN_ROLES, ROLE_LABEL, assignableRoles } from "@/lib/admin-roles";
import { canAssign, findUserIdByEmail } from "@/lib/admin-team";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { esc } from "@/lib/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const g = await checkAdmin("team");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("role", ALL_ADMIN_ROLES)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ admins: profiles ?? [], me: { id: g.user.id, role: g.role }, assignable: assignableRoles(g.role) });
}

const NewMember = z.object({
  email: z.string().trim().email("Enter a valid email"),
  full_name: z.string().trim().max(80).optional().default(""),
  role: z.string(),
  password: z.string().min(10, "Password must be at least 10 characters").max(72),
});

export async function POST(req: Request) {
  const g = await checkAdmin("team");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const parsed = NewMember.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Check the form" }, { status: 400 });
  const { email, full_name, role, password } = parsed.data;
  if (!canAssign(g.role, role)) return NextResponse.json({ error: "You can't give this role" }, { status: 403 });

  const admin = createAdminClient();
  let userId = await findUserIdByEmail(admin, email);
  const usedExisting = !!userId;

  if (userId) {
    const { data: p } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    if (p && p.role !== "customer") return NextResponse.json({ error: "This email is already on the team" }, { status: 409 });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email },
    });
    if (error || !created?.user) return NextResponse.json({ error: error?.message || "Could not create the account" }, { status: 400 });
    userId = created.user.id;
  }

  const { error: upErr } = await admin
    .from("profiles")
    .upsert({ id: userId, email, full_name: full_name || email, role, is_active: true });
  if (upErr) { console.error("[admin/users]", upErr.message); return NextResponse.json({ error: "Could not save the team member" }, { status: 500 }); }

  await sendEmail({
    to: email,
    subject: `You've been added to the Jack & Jill admin panel (${ROLE_LABEL[role]})`,
    html: `<p>Hi ${esc(full_name || "")},</p><p>You can now use the Jack &amp; Jill admin panel as <b>${ROLE_LABEL[role]}</b>.</p>
<p>Log in at <a href="${SITE_URL}/admin/login">${SITE_URL}/admin/login</a> with this email${usedExisting ? " and your existing password" : " and the password you were given"}. A one-time code is emailed to you on every login.</p>`,
  }).catch(() => null);

  return NextResponse.json({ ok: true, user_id: userId, existing: usedExisting });
}
