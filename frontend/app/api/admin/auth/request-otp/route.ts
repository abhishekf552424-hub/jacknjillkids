import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { generateOtp, hashOtp, otpEmailHtml } from "@/lib/otp";
import { sendEmail } from "@/lib/resend";

export const runtime = "nodejs";

// Verifies email+password (without creating a session), rate-limits, generates an OTP,
// stores its hash and emails it. Sets a short-lived challenge cookie carrying the user_id.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    // 1) Validate credentials without persisting a session (uses anon key on a one-shot client)
    const oneShot = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signin, error: signErr } = await oneShot.auth.signInWithPassword({ email, password });
    if (signErr || !signin?.user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const userId = signin.user.id;
    await oneShot.auth.signOut();

    // 2) Confirm the user is actually an admin (not a customer)
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role,is_active,full_name").eq("id", userId).maybeSingle();
    if (!profile || profile.role === "customer") return NextResponse.json({ error: "Not an admin account" }, { status: 403 });
    if (profile.is_active === false) return NextResponse.json({ error: "This admin account is deactivated" }, { status: 403 });

    // 3) Rate-limit: 3 OTP requests per 10 minutes per user
    const { data: recent } = await admin
      .from("admin_otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("purpose", "admin_login")
      .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString());
    const recentCount = recent?.length ?? 0;
    if (recentCount >= 3) return NextResponse.json({ error: "Too many OTP requests. Try again in 10 minutes." }, { status: 429 });

    // 4) Generate and store OTP (10-minute expiry — matches the challenge cookie
    //    lifetime so users don't get a false "incorrect code" error caused by
    //    email delivery lag on a 5-minute code).
    const code = generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
    // invalidate any previous unused codes for this purpose so a stale email can't be used
    await admin.from("admin_otp_codes").update({ consumed: true }).eq("user_id", userId).eq("purpose", "admin_login").eq("consumed", false);
    const { error: insErr } = await admin.from("admin_otp_codes").insert({
      user_id: userId,
      purpose: "admin_login",
      code_hash: hashOtp(code),
      expires_at: expiresAt,
    });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    // 5) Email OTP — check the actual result instead of assuming success.
    //    Resend's sandbox sender (onboarding@resend.dev) can only deliver to
    //    the Resend account's own registered email until a custom domain is
    //    verified — every other recipient silently fails otherwise. Surface
    //    that clearly instead of pretending the email went out.
    const emailResult = await sendEmail({ to: email, subject: `Jack & Jill admin login code: ${code}`, html: otpEmailHtml(code, "admin_login") });
    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error:
            "Your login code was generated, but the email could not be delivered. " +
            "This usually means the sending domain isn't verified in Resend yet " +
            "(the sandbox sender can only email the Resend account's own address). " +
            "Ask a super admin to verify jacknjillkids.com in Resend and update MAIL_FROM, " +
            "or check the server logs for a temporary fallback code.",
        },
        { status: 502 },
      );
    }

    // 6) Set challenge cookie (10 min) with just the user_id + email — password NOT stored
    const jar = await cookies();
    jar.set("admin_otp_challenge", JSON.stringify({ uid: userId, email, ts: Date.now() }), {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 10 * 60,
    });

    return NextResponse.json({ ok: true, hint: `We sent a fresh 6-digit code to ${email}. It's valid for 10 minutes. Any earlier code has been invalidated — use only the newest email.` });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
