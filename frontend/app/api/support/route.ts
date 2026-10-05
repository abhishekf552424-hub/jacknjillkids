import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { allow, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ tickets: [] });
  const admin = createAdminClient();
  const { data } = await admin.from("support_tickets").select("*, msgs:support_ticket_messages(*)").eq("user_id", user.id).order("created_at", { ascending: false });
  return NextResponse.json({ tickets: data || [] });
}

const Body = z.object({
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(1, "Please write your message").max(3000),
  order_number: z.string().trim().max(30).optional(),
  attachment_url: z.string().trim().max(500).optional(),
  guest_name: z.string().trim().max(80).optional(),
  guest_email: z.string().trim().email("Please enter a valid email so we can reply").max(120).optional().or(z.literal("")),
  guest_phone: z.string().trim().max(20).optional(),
});

// Only pictures uploaded to our own storage can be attached.
const SAFE_ATTACHMENT = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//i;

export async function POST(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check your message" }, { status: 400 });
  const { subject, message, order_number, attachment_url, guest_name, guest_email, guest_phone } = parsed.data;

  const admin = createAdminClient();
  if (!(await allow(`support:${user?.id || clientIp(req)}`, 6, 3600, admin))) {
    return NextResponse.json({ error: "Too many messages. Please wait a little or call the store." }, { status: 429 });
  }

  // Resolve email: signed-in user, or guest_email if provided (widget)
  const email = (user?.email || guest_email || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "Please provide your email so we can respond" }, { status: 400 });

  // Link an order only if it belongs to this person (account or same email).
  let order_id: string | null = null;
  if (order_number) {
    const { data: order } = await admin.from("orders").select("id, user_id, guest_email, shipping_address").eq("order_number", order_number.toUpperCase()).maybeSingle();
    const ownsIt = order && ((user && order.user_id === user.id) || [order.guest_email, order.shipping_address?.email].some((e: any) => typeof e === "string" && e.toLowerCase() === email));
    order_id = ownsIt ? order!.id : null;
  }

  const subj = subject || message.slice(0, 60) + (message.length > 60 ? "…" : "");

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
  if (error) {
    console.error("[support]", error.message);
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }

  await admin.from("support_ticket_messages").insert({
    ticket_id: t.id,
    author_role: "customer",
    author_id: user?.id || null,
    body: message,
    attachment_url: attachment_url && SAFE_ATTACHMENT.test(attachment_url) ? attachment_url : null,
  });

  return NextResponse.json({ ok: true, id: t.id });
}
