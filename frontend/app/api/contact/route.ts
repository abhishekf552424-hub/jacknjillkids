import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { esc } from "@/lib/html";
import { allow, clientIp } from "@/lib/rate-limit";
import { z } from "zod";

const Schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(20).optional().default(""),
  message: z.string().trim().min(5).max(2000),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Please fill in your name, a valid email and a message." }, { status: 400 });
  const data = parsed.data;
  const admin = createAdminClient();
  if (!(await allow(`contact:${clientIp(req)}`, 5, 3600, admin))) {
    return NextResponse.json({ ok: false, error: "Too many messages. Please try again later or call the store." }, { status: 429 });
  }
  const { error } = await admin.from("contact_submissions").insert(data);
  if (error) {
    console.error("[contact]", error.message);
    return NextResponse.json({ ok: false, error: "Could not send your message. Please try again." }, { status: 500 });
  }
  // notify the shop (best-effort); everything the visitor typed is escaped
  sendEmail({
    to: process.env.MAIL_FROM || "onboarding@resend.dev",
    subject: `New contact form: ${data.name.replace(/[\r\n]/g, " ").slice(0, 60)}`,
    html: `<p><strong>${esc(data.name)}</strong> (${esc(data.email)}, ${esc(data.phone || "no phone")})</p><p>${esc(data.message).replace(/\n/g, "<br/>")}</p>`,
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
