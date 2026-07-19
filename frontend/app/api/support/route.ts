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
  const { subject, message, order_number } = await req.json();
  if (!subject || !message) return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  const admin = createAdminClient();
  let order_id: string | null = null;
  if (order_number) {
    const { data: order } = await admin.from("orders").select("id").eq("order_number", order_number).maybeSingle();
    order_id = order?.id || null;
  }
  const email = user?.email || "";
  if (!email) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const { data: t, error } = await admin.from("support_tickets").insert({ user_id: user?.id, email, subject, order_id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("support_ticket_messages").insert({ ticket_id: t.id, author_role: "customer", author_id: user?.id, body: message });
  return NextResponse.json({ ok: true, id: t.id });
}
