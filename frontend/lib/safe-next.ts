/** Only allow redirects to pages on this site (blocks "//evil.com", "/\\evil.com", tabs/newlines and "https://…"). */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (raw.length > 300 || /[\t\r\n\\]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  try {
    const u = new URL(raw, "http://x.invalid");
    if (u.origin !== "http://x.invalid") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
