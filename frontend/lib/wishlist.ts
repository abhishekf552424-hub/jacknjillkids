"use client";

/**
 * Wishlist that works for everyone:
 *  - guests: saved in this browser,
 *  - signed-in customers: also saved to their account (any device),
 *    and the guest list is merged in the first time they visit while signed in.
 */
const KEY = "jj_wishlist";
const EVT = "wishlist:update";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 500) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    /* storage blocked — list lives for this page only */
  }
  window.dispatchEvent(new CustomEvent(EVT));
}

let signedIn: boolean | null = null;
let syncing: Promise<void> | null = null;

/** Merge the browser list into the account once per page load. */
export function syncWishlist(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    try {
      const local = read();
      const res = local.length
        ? await fetch("/api/wishlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_ids: local }) })
        : await fetch("/api/wishlist", { cache: "no-store" });
      if (res.status === 401) {
        signedIn = false;
        return;
      }
      const j = await res.json();
      signedIn = !!j.signedIn;
      if (signedIn && Array.isArray(j.ids)) write([...j.ids, ...local]);
    } catch {
      signedIn = false;
    }
  })();
  return syncing;
}

export const wishlist = {
  event: EVT,
  ids: read,
  has: (id: string) => read().includes(id),
  count: () => read().length,
  /** Returns true when the product is now saved. */
  async toggle(id: string): Promise<boolean> {
    const list = read();
    const on = !list.includes(id);
    write(on ? [id, ...list] : list.filter((x) => x !== id));
    await syncWishlist();
    if (signedIn) {
      try {
        if (on) await fetch("/api/wishlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_ids: [id] }) });
        else await fetch(`/api/wishlist?product_id=${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch {
        /* kept in the browser; next sync retries */
      }
    }
    return on;
  },
};
