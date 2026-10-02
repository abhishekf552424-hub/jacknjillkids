import crypto from "crypto";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin authentication helpers (server-only).
 *
 * Admin access needs THREE things, checked on every admin page AND every
 * /api/admin route:
 *   1. a Supabase session (password login),
 *   2. an active profile with an admin role allowed for that route,
 *   3. a valid 2FA cookie — HMAC-signed, bound to the same user id, with expiry.
 *
 * Cookies used during login (`admin_otp_challenge`) and after it (`admin_2fa_ok`)
 * are signed with ADMIN_SESSION_SECRET (falls back to a key derived from
 * SUPABASE_SERVICE_ROLE_KEY so existing deployments keep working).
 */

export type AdminRole = "super_admin" | "order_manager" | "content_manager";
export const ALL_ADMIN_ROLES: AdminRole[] = ["super_admin", "order_manager", "content_manager"];

export const TWO_FA_COOKIE = "admin_2fa_ok";
export const CHALLENGE_COOKIE = "admin_otp_challenge";
export const TWO_FA_TTL_SECONDS = 12 * 60 * 60;
export const CHALLENGE_TTL_SECONDS = 10 * 60;

function signingKey(): Buffer {
  const base = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("ADMIN_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set");
  return crypto.createHash("sha256").update(`jj-admin-cookie-v1:${base}`).digest();
}

/** Serialises `payload` as base64url JSON plus an HMAC tag. */
export function signValue(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const tag = crypto.createHmac("sha256", signingKey()).update(body).digest("base64url");
  return `${body}.${tag}`;
}

/** Returns the payload if the tag is valid and `exp` (unix seconds) is in the future. */
export function readSignedValue<T extends { exp: number }>(value: string | undefined | null): T | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const tag = value.slice(dot + 1);
  const expected = crypto.createHmac("sha256", signingKey()).update(body).digest("base64url");
  const a = Buffer.from(tag);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const nowSec = () => Math.floor(Date.now() / 1000);

export function makeTwoFaCookie(uid: string): string {
  return signValue({ k: "2fa", uid, exp: nowSec() + TWO_FA_TTL_SECONDS });
}

export function isTwoFaCookieValid(value: string | undefined | null, uid: string): boolean {
  const p = readSignedValue<{ k: string; uid: string; exp: number }>(value);
  return !!p && p.k === "2fa" && p.uid === uid;
}

export function makeChallengeCookie(uid: string): string {
  return signValue({ k: "ch", uid, exp: nowSec() + CHALLENGE_TTL_SECONDS });
}

export function readChallengeCookie(value: string | undefined | null): { uid: string } | null {
  const p = readSignedValue<{ k: string; uid: string; exp: number }>(value);
  return p && p.k === "ch" && typeof p.uid === "string" ? { uid: p.uid } : null;
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

export type AdminGuardResult =
  | { ok: true; user: User; role: AdminRole }
  | { ok: false; error: string; status: 401 | 403 };

/**
 * Use at the top of every admin API route:
 *   const g = await checkAdmin(["super_admin", "content_manager"]);
 *   if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });
 */
export async function checkAdmin(allowed: AdminRole[] = ALL_ADMIN_ROLES): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in", status: 401 };

  const jar = await cookies();
  if (!isTwoFaCookieValid(jar.get(TWO_FA_COOKIE)?.value, user.id)) {
    return { ok: false, error: "Admin verification required — please log in again", status: 401 };
  }

  const { data: p } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (!p || p.is_active === false || !allowed.includes(p.role as AdminRole)) return { ok: false, error: "Forbidden", status: 403 };
  return { ok: true, user, role: p.role as AdminRole };
}

/**
 * Guard for admin server pages. Layouts are not re-rendered on client-side
 * navigation, so every page that reads data with the service-role client must
 * check access itself — never rely on app/admin/layout.tsx alone.
 */
export async function requireAdminPage(allowed: AdminRole[] = ALL_ADMIN_ROLES) {
  const g = await checkAdmin(allowed);
  if ("error" in g) {
    const { redirect } = await import("next/navigation");
    redirect(g.status === 401 ? "/admin/login" : allowed.length === ALL_ADMIN_ROLES.length ? "/account" : "/admin");
  }
  return g as Extract<AdminGuardResult, { ok: true }>;
}
