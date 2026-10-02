export type PlpParams = Record<string, string | undefined>;

/**
 * Builds a listing URL from the current filters plus changes. A category
 * always lives in the path (/category/<slug>) so Google indexes one clean URL
 * per category; everything else stays in the query string. Changing any
 * filter resets pagination.
 */
export function plpHref(current: PlpParams, changes: Record<string, string | null | undefined> = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (v) q.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === undefined || v === "") q.delete(k);
    else q.set(k, v);
  }
  if (!("page" in changes)) q.delete("page");
  const cat = q.get("category");
  q.delete("category");
  const qs = q.toString();
  return `${cat ? `/category/${encodeURIComponent(cat)}` : "/shop"}${qs ? `?${qs}` : ""}`;
}
