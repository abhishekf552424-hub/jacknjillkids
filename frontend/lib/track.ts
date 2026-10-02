"use client";

/**
 * Sends shop events to Google Analytics 4 and the Meta Pixel when they are
 * installed (Admin → Settings → Marketing). Does nothing otherwise, and never
 * throws — tracking must not break the shop.
 */
export type TrackItem = { id: string; name: string; price: number; quantity?: number; variant?: string; category?: string };

type GA4Event = "view_item" | "add_to_cart" | "add_to_wishlist" | "begin_checkout" | "purchase";
const META: Record<GA4Event, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
};

export function track(event: GA4Event, items: TrackItem[], extra: { value?: number; transaction_id?: string; shipping?: number; tax?: number; coupon?: string } = {}) {
  if (typeof window === "undefined") return;
  try {
    const value = extra.value ?? items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", event, {
        currency: "INR",
        value,
        ...(extra.transaction_id ? { transaction_id: extra.transaction_id } : {}),
        ...(extra.shipping !== undefined ? { shipping: extra.shipping } : {}),
        ...(extra.tax !== undefined ? { tax: extra.tax } : {}),
        ...(extra.coupon ? { coupon: extra.coupon } : {}),
        items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_variant: i.variant, item_category: i.category })),
      });
    }
    if (typeof w.fbq === "function") {
      w.fbq(
        "track",
        META[event],
        { currency: "INR", value, content_type: "product", content_ids: items.map((i) => i.id), contents: items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })), num_items: items.reduce((s, i) => s + (i.quantity ?? 1), 0) },
        extra.transaction_id ? { eventID: extra.transaction_id } : undefined,
      );
    }
  } catch {
    /* never break the shop */
  }
}

/** Purchase must be counted once per order, even if the page is reloaded. */
export function trackPurchaseOnce(orderNumber: string, items: TrackItem[], extra: { value: number; shipping?: number; tax?: number; coupon?: string }) {
  if (typeof window === "undefined") return;
  const key = `jj_tracked_${orderNumber}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    /* storage blocked: still send once for this page view */
  }
  track("purchase", items, { ...extra, transaction_id: orderNumber });
}
