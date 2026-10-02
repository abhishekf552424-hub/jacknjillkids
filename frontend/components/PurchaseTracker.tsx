"use client";

import { useEffect } from "react";
import { trackPurchaseOnce, type TrackItem } from "@/lib/track";

/** Sends the "purchase" event once per order (GA4 + Meta Pixel). */
export default function PurchaseTracker({ orderNumber, value, shipping, tax, coupon, items }: { orderNumber: string; value: number; shipping?: number; tax?: number; coupon?: string | null; items: TrackItem[] }) {
  useEffect(() => {
    // Give the analytics scripts a moment to load on a fresh page.
    const t = setTimeout(() => trackPurchaseOnce(orderNumber, items, { value, shipping, tax, coupon: coupon || undefined }), 1500);
    return () => clearTimeout(t);
  }, [orderNumber, value, shipping, tax, coupon, items]);
  return null;
}
