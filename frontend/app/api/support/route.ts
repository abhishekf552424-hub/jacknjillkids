import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ tickets: [] });
  const admin = createAdminClient();
  const { data } = await admin.from("support_tickets").select("*, msgs:support_ticket_messages(*)").eq("user_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  const body = await req.json();
  const { subject, message, order_number, attachment_url, guest_name, guest_email, guest_phone } = body;
  if (!message || !message.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const admin = createAdminClient();
  let order_id: string | null = null;
  if (order_number) {
    const { data: order } = await admin.from("orders").select("id").eq("order_number", order_number).maybeSingle();
    order_id = order?.id || null;
  }

  // Resolve email: signed-in user, or guest_email if provided (widget)
  const email = user?.email || guest_email || "";
  if (!email) return NextResponse.json({ error: "Please provide your email so we can respond" }, { status: 400 });

  const subj = subject && subject.trim() ? subject.trim() : (message.trim().slice(0, 60) + (message.length > 60 ? "…" : ""));

  const { data: t, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: user?.id || null,
      email,
      subject: subj,
      order_id,
      guest_name: !user ? (guest_name || null) : null,
      guest_phone: !user ? (guest_phone || null) : null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("support_ticket_messages").insert({
    ticket_id: t.id,
    author_role: "customer",
    author_id: user?.id || null,
    body: message,
    attachment_url: attachment_url || null,
  });

  return NextResponse.json({ ok: true, id: t.id });
}
