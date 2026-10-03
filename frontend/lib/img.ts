/**
 * Serve an uploaded (Supabase) image through Next's image optimiser at a set
 * width: WebP/AVIF, resized, cached. Other URLs are returned unchanged.
 * Widths must be in Next's default size list.
 */
export function optimised(url: string | null | undefined, width: 64 | 96 | 128 | 256 | 384 | 640 | 750 | 828, quality = 80): string {
  if (!url) return "";
  const local = url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/_next/");
  if (!local && !/^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}
