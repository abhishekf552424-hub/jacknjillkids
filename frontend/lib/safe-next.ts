/** Only allow redirects to pages on this site (blocks "//evil.com" and "https://…"). */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw || typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\") || raw.length > 300) return fallback;
  return raw;
}
