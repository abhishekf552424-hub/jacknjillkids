/**
 * "Coming soon" switch (edge-safe: used by middleware).
 *
 * settings.site_mode = { live: boolean }. While live is false, visitors see
 * /coming-soon on every shop page. Signed-in admins (valid admin_2fa_ok
 * cookie) still see the real site, so the team can demo it to the client
 * and switch it live from Admin → Settings.
 */

export type SiteMode = { live: boolean };

let cache: { at: number; mode: SiteMode } | null = null;
const TTL_MS = 15_000;

/** Reads the switch from Supabase (public row), cached for 15 s per server. */
export async function getSiteMode(): Promise<SiteMode> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.mode;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/settings?key=eq.site_mode&select=value`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as { value?: { live?: unknown } }[];
    // No row at all = the switch was never set up = behave like a normal live site.
    const mode = { live: rows.length === 0 ? true : rows[0]?.value?.live === true };
    cache = { at: Date.now(), mode };
    return mode;
  } catch {
    // Database hiccup: keep the last known state; if we never knew it, stay safe (coming soon).
    return cache?.mode ?? { live: false };
  }
}

// ---- admin cookie check (same signing scheme as lib/admin-auth.ts, via Web Crypto) ----

const enc = new TextEncoder();
let keyPromise: Promise<CryptoKey> | null = null;

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey | null> {
  const base = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) return null;
  keyPromise ??= (async () => {
    const raw = await crypto.subtle.digest("SHA-256", enc.encode(`jj-admin-cookie-v1:${base}`));
    return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  })();
  return keyPromise;
}

/** True when the request carries a valid, unexpired admin 2FA cookie. */
export async function isAdminRequestCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = value.slice(0, dot);
  const tag = value.slice(dot + 1);
  try {
    const key = await hmacKey();
    if (!key) return false;
    const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(tag), enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as { k?: string; exp?: number };
    return payload.k === "2fa" && typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
