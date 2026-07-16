"use client";

import type { CartLine } from "./types";

// Lightweight cart store using localStorage — persisted client-side.
// Switch to Supabase-backed cart when user is authenticated (upsert on login).

const KEY = "jj_cart";

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("cart:update"));
}

export const cart = {
  get: read,
  add(line: CartLine) {
    const lines = read();
    const idx = lines.findIndex((l) => l.variant_id === line.variant_id);
    if (idx >= 0) lines[idx].quantity = Math.min(lines[idx].quantity + line.quantity, line.stock_qty);
    else lines.push(line);
    write(lines);
  },
  update(variant_id: string, quantity: number) {
    const lines = read().map((l) =>
      l.variant_id === variant_id ? { ...l, quantity: Math.max(1, Math.min(quantity, l.stock_qty)) } : l,
    );
    write(lines);
  },
  remove(variant_id: string) {
    write(read().filter((l) => l.variant_id !== variant_id));
  },
  clear() {
    write([]);
  },
  count() {
    return read().reduce((s, l) => s + l.quantity, 0);
  },
  subtotal() {
    return read().reduce((s, l) => s + l.price * l.quantity, 0);
  },
};
