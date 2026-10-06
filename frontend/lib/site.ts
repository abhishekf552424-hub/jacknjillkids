/**
 * Canonical site origin, used for canonical URLs, sitemap, robots, feeds,
 * structured data and email links. Set NEXT_PUBLIC_SITE_URL in production;
 * the fallback is the real domain (the old code fell back to another
 * project's domain, alankarfashions.com).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://jacknjillkids.com").replace(/\/+$/, "");

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Make a stored image path absolute for feeds, structured data and emails.
 *  Full URLs (Supabase uploads) are returned as they are. */
export const absUrl = (u?: string | null) => (!u ? "" : /^https?:\/\//i.test(u) ? u : abs(u));

/**
 * The address the visitor actually used (e.g. https://jacknjillkids.com).
 * On Hostinger the app runs behind a proxy, so `request.url` says http://0.0.0.0:3000 —
 * never redirect there. Use the proxy's forwarded host when it is one of our own domains,
 * otherwise the configured SITE_URL.
 */
export function publicOrigin(request: Request): string {
  const site = new URL(SITE_URL);
  const bare = site.hostname.replace(/^www\./, "");
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim().toLowerCase();
  const name = host.replace(/:\d+$/, "");
  if (name === bare || name === `www.${bare}`) {
    const proto = (request.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
    return `${proto === "http" ? "http" : "https"}://${host}`;
  }
  return SITE_URL;
}
