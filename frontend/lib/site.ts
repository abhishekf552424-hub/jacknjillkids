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
