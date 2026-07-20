// URL normalizers for third-party video embeds.
// Converts pasted "page" URLs into their iframe-able "player/embed" URLs.

export function normalizeVimeoUrl(url: string): string {
  if (!url) return url;
  // Already a player URL — leave as-is.
  if (/player\.vimeo\.com\/video\//i.test(url)) return url;
  // Match vimeo.com/{id} (id may be followed by /hash or ?query).
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w-]+))?/i);
  if (!m) return url;
  const id = m[1];
  const hash = m[2];
  return hash
    ? `https://player.vimeo.com/video/${id}?h=${hash}`
    : `https://player.vimeo.com/video/${id}`;
}

export function normalizeYouTubeUrl(url: string): string {
  if (!url) return url;
  // Already an embed URL.
  if (/youtube\.com\/embed\//i.test(url)) return url;
  // youtu.be/{id}
  let m = url.match(/youtu\.be\/([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // youtube.com/watch?v={id}
  m = url.match(/[?&]v=([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  // youtube.com/shorts/{id}
  m = url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}`;
  return url;
}

export function normalizeEmbedUrl(url: string): string {
  if (!url) return url;
  if (/vimeo\.com/i.test(url)) return normalizeVimeoUrl(url);
  if (/youtube\.com|youtu\.be/i.test(url)) return normalizeYouTubeUrl(url);
  return url;
}

export function isInstagramPermalink(url: string): boolean {
  return /instagram\.com\/(reel|p|tv)\//i.test(url || "");
}
