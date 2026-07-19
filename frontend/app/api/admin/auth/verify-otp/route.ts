import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashOtp } from "@/lib/otp";

export const runtime = "nodejs";

// Verifies OTP against admin_otp_codes for the pending admin login challenge.
// On success: generates a Supabase magic-link, exchanges the token via verifyOtp() to create
// a real Supabase auth session, sets a supplemental `admin_2fa_ok` cookie (12h) that the
// admin layout requires alongside the normal Supabase session.
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });

    const jar = await cookies();
    const ch = jar.get("admin_otp_challenge")?.value;
    if (!ch) return NextResponse.json({ error: "Challenge expired — please log in again" }, { status: 400 });
    const challenge = JSON.parse(ch) as { uid: string; email: string; ts: number };

    const admin = createAdminClient();
    // fetch most recent unused OTP for this user + purpose
    const { data: rows } = await admin
      .from("admin_otp_codes")
      .select("id, code_hash, expires_at, attempts, max_attempts, consumed")
      .eq("user_id", challenge.uid)
      .eq("purpose", "admin_login")
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);
    const row = rows?.[0];
    if (!row) return NextResponse.json({ error: "No pending code — please request a new one" }, { status: 400 });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from("admin_otp_codes").update({ consumed: true }).eq("id", row.id);
      return NextResponse.json({ error: "Code expired — request a new one" }, { status: 400 });
    }
    if (row.attempts >= row.max_attempts) {
      await admin.from("admin_otp_codes").update({ consumed: true }).eq("id", row.id);
      return NextResponse.json({ error: "Too many wrong attempts. Request a new code." }, { status: 429 });
    }

    if (hashOtp(code) !== row.code_hash) {
      await admin.from("admin_otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return NextResponse.json({ error: "Incorrect code" }, { status: 401 });
    }

    // consume
    await admin.from("admin_otp_codes").update({ consumed: true }).eq("id", row.id);

    // Issue a Supabase session for the user via generateLink('magiclink') and verify it server-side.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: challenge.email,
    });
    if (linkErr || !link?.properties?.hashed_token) {
      return NextResponse.json({ error: linkErr?.message || "Could not create session" }, { status: 500 });
    }

    // Set challenge cookie invalid and 2fa_ok cookie for 12h; the client will then hit
    // /auth/verify to consume the token_hash and set the sb cookies.
    jar.delete("admin_otp_challenge");
    jar.set("admin_2fa_ok", "1", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 12 * 60 * 60 });

    return NextResponse.json({
      ok: true,
      token_hash: link.properties.hashed_token,
      email: challenge.email,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
