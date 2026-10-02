"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import { wishlist, syncWishlist } from "@/lib/wishlist";

export default function WishlistClient() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    const ids = wishlist.ids();
    if (!ids.length) {
      setProducts([]);
      return;
    }
    try {
      const r = await fetch(`/api/products/by-ids?ids=${ids.join(",")}`);
      const j = await r.json();
      setProducts(j.products ?? []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    load();
    syncWishlist().then(async () => {
      const r = await fetch("/api/wishlist", { cache: "no-store" }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      setSignedIn(!!j.signedIn);
      load();
    });
    const onChange = () => load();
    window.addEventListener(wishlist.event, onChange);
    return () => window.removeEventListener(wishlist.event, onChange);
  }, [load]);

  return (
    <div className="container py-10 md:py-14">
      <p className="text-xs uppercase tracking-widest text-gold-text font-bold">Saved for later</p>
      <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight">My wishlist</h1>
      {signedIn === false && (products?.length ?? 0) > 0 && (
        <p className="mt-2 text-sm text-muted">
          Saved on this device. <Link href="/auth?next=/account/wishlist" className="font-semibold text-doodle underline">Sign in</Link> to keep it on every device.
        </p>
      )}

      {products === null ? (
        <p className="mt-10 text-muted flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <span className="mx-auto mb-3 w-14 h-14 rounded-full bg-blush flex items-center justify-center">
            <Heart className="w-6 h-6 text-action" />
          </span>
          <p className="font-display text-xl text-navy">Your wishlist is empty</p>
          <p className="text-sm text-muted mt-1">Tap the ♡ on any product to save it here.</p>
          <Link href="/shop" className="mt-5 inline-block rounded-full bg-action hover:bg-action-hover text-white px-6 py-3 text-sm font-semibold">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
