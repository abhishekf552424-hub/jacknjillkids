import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(20).optional().default(""),
  message: z.string().min(5).max(2000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = Schema.parse(body);
    const admin = createAdminClient();
    await admin.from("contact_submissions").insert(data);
    // notify (best-effort)
    sendEmail({
      to: process.env.MAIL_FROM || "onboarding@resend.dev",
      subject: `New contact form: ${data.name}`,
      html: `<p><strong>${data.name}</strong> (${data.email}, ${data.phone || "no phone"})</p><p>${data.message.replace(/\n/g, "<br/>")}</p>`,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Invalid input" }, { status: 400 });
  }
}
