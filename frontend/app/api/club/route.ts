import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalisePhone } from "@/lib/phone";

export const runtime = "nodejs";

const Body = z.object({
  phone: z.string().trim().max(20),
  consent: z.literal(true, { errorMap: () => ({ message: "Please tick the box so we can message you" }) }),
});

// Best-effort limit per server instance: 5 sign-ups per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 600_000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

/** Homepage "Join the club": saves the WhatsApp number and returns the first-order code set in Admin. */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 });
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: "Please enter a valid 10-digit mobile number" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("club_members").upsert({ phone, consent: true, source: "homepage" }, { onConflict: "phone", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Could not join. Please try again." }, { status: 500 });

  // The code comes from the admin's section settings, and only if that coupon is live.
  const { data: section } = await admin.from("homepage_sections").select("config").eq("section_type", "join_club").limit(1).maybeSingle();
  const code = String((section?.config as any)?.coupon_code || "").trim().toUpperCase();
  let coupon_code: string | null = null;
  if (code) {
    const { data: c } = await admin.from("coupons").select("code, valid_from, valid_to").eq("code", code).eq("is_active", true).maybeSingle();
    const now = Date.now();
    const live = c && (!c.valid_from || new Date(c.valid_from).getTime() <= now) && (!c.valid_to || new Date(c.valid_to).getTime() >= now);
    coupon_code = live ? c.code : null;
  }
  return NextResponse.json({ ok: true, coupon_code });
}
