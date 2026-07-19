import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

async function requireAdmin() {
  const s = await createClient(); const { data: { user } } = await s.auth.getUser(); if (!user) return null;
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return p && p.role !== "customer" ? user : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin(); if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const { body } = await req.json();
  const admin = createAdminClient();
  const { data: msg, error } = await admin.from("support_ticket_messages").insert({ ticket_id: id, author_role: "admin", author_id: me.id, body }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: ticket } = await admin.from("support_tickets").select("email, subject").eq("id", id).maybeSingle();
  if (ticket?.email) {
    await sendEmail({ to: ticket.email, subject: `Re: ${ticket.subject}`, html: `<p>${body.replace(/\n/g, "<br>")}</p><hr><p style="color:#888;font-size:12px">Jack &amp; Jill support team.</p>` });
  }
  return NextResponse.json({ ok: true, message: msg });
}
