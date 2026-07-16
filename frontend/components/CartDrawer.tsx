"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cart } from "@/lib/cart";
import type { CartLine } from "@/lib/types";
import { formatINR } from "@/lib/utils";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const sync = () => setLines(cart.get());
    sync();
    window.addEventListener("cart:update", sync);
    return () => window.removeEventListener("cart:update", sync);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-navy/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            data-testid="cart-drawer"
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-cream flex flex-col shadow-premium"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10">
              <h2 className="font-display text-xl text-navy">Your Bag</h2>
              <button data-testid="cart-close" onClick={onClose} className="p-2 rounded-full hover:bg-navy/5">
                <X className="w-5 h-5 text-navy" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-soft">
                    <ShoppingBag className="w-7 h-7 text-navy" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-navy">Your bag is empty</p>
                    <p className="text-sm text-muted">Discover something little ones will love.</p>
                  </div>
                  <Link href="/shop" onClick={onClose} className="mt-2 bg-navy text-white rounded px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {lines.map((l) => (
                    <li key={l.variant_id} data-testid={`cart-line-${l.variant_id}`} className="flex gap-3 bg-white rounded p-3">
                      <div className="relative w-20 h-20 rounded-sm overflow-hidden bg-cream shrink-0">
                        {l.image && <Image src={l.image} alt={l.product_name} fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${l.slug}`} onClick={onClose} className="text-sm font-medium text-navy line-clamp-2">
                          {l.product_name}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{l.variant_label}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 border border-navy/10 rounded-full">
                            <button
                              aria-label="Decrease"
                              onClick={() => cart.update(l.variant_id, l.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-navy hover:bg-navy/5 rounded-full"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-medium w-5 text-center">{l.quantity}</span>
                            <button
                              aria-label="Increase"
                              onClick={() => cart.update(l.variant_id, l.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-navy hover:bg-navy/5 rounded-full"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-navy">{formatINR(l.price * l.quantity)}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        data-testid={`cart-remove-${l.variant_id}`}
                        aria-label="Remove"
                        onClick={() => cart.remove(l.variant_id)}
                        className="text-muted hover:text-error p-1 self-start"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-navy/10 p-6 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span data-testid="cart-subtotal" className="font-display text-xl text-navy">{formatINR(subtotal)}</span>
                </div>
                <p className="text-xs text-muted mb-4">Shipping & taxes calculated at checkout.</p>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  data-testid="checkout-cta"
                  className="block text-center bg-navy text-white rounded py-3 font-medium hover:opacity-90 transition-opacity"
                >
                  Checkout
                </Link>
                <button
                  onClick={onClose}
                  className="block w-full text-center text-navy py-3 mt-2 text-sm hover:underline"
                >
                  Continue shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
