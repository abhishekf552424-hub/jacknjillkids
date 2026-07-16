"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, AgeGroup } from "@/lib/types";

const SORTS = [
  { v: "", label: "Popular" },
  { v: "newest", label: "Newest" },
  { v: "price_asc", label: "Price: Low → High" },
  { v: "price_desc", label: "Price: High → Low" },
];
const GENDERS = [
  { v: "boys", label: "Boys" },
  { v: "girls", label: "Girls" },
  { v: "unisex", label: "Unisex" },
];

export default function PLPFilters({
  categories,
  ageGroups,
  current,
}: {
  categories: Category[];
  ageGroups: AgeGroup[];
  current: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(current.min ?? "");
  const [max, setMax] = useState(current.max ?? "");

  const topCats = categories.filter((c) => !c.parent_id);

  const setParam = (key: string, val: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (val === null || val === "") q.delete(key);
    else q.set(key, val);
    q.delete("page");
    start(() => router.push(`/shop?${q.toString()}`));
  };

  const Content = (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-navy mb-3">Sort by</p>
        <select
          data-testid="filter-sort"
          value={current.sort ?? ""}
          onChange={(e) => setParam("sort", e.target.value)}
          className="w-full bg-white border border-navy/10 rounded px-3 py-2 text-sm text-navy focus:border-gold outline-none"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-navy mb-3">Category</p>
        <div className="space-y-1.5">
          <button
            onClick={() => setParam("category", null)}
            className={`block w-full text-left text-sm py-1 ${!current.category ? "text-gold font-medium" : "text-navy/80 hover:text-navy"}`}
          >
            All
          </button>
          {topCats.map((c) => (
            <button
              key={c.id}
              data-testid={`filter-cat-${c.slug}`}
              onClick={() => setParam("category", c.slug)}
              className={`block w-full text-left text-sm py-1 ${current.category === c.slug ? "text-gold font-medium" : "text-navy/80 hover:text-navy"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-navy mb-3">Age Group</p>
        <div className="flex flex-wrap gap-2">
          {ageGroups.map((a) => (
            <button
              key={a.id}
              onClick={() => setParam("age", current.age === a.slug ? null : a.slug)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                current.age === a.slug
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-navy border-navy/10 hover:border-gold hover:text-gold"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-navy mb-3">Gender</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.v}
              onClick={() => setParam("gender", current.gender === g.v ? null : g.v)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                current.gender === g.v ? "bg-navy text-white border-navy" : "bg-white text-navy border-navy/10 hover:border-gold"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest font-bold text-navy mb-3">Price (₹)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full bg-white border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full bg-white border border-navy/10 rounded px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
        <button
          onClick={() => {
            const q = new URLSearchParams(params.toString());
            if (min) q.set("min", min); else q.delete("min");
            if (max) q.set("max", max); else q.delete("max");
            start(() => router.push(`/shop?${q.toString()}`));
          }}
          className="mt-3 w-full bg-navy text-white rounded px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Apply
        </button>
      </div>

      <Link
        href="/shop"
        className="block text-center text-xs text-muted underline hover:text-navy"
      >
        Reset all filters
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block bg-white/50 rounded-lg p-5 border border-navy/5 h-fit sticky top-24">
        {Content}
      </aside>

      {/* Mobile trigger */}
      <div className="lg:hidden">
        <button
          data-testid="filters-open"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-navy text-white rounded-full px-4 py-2 text-sm font-medium shadow-soft"
        >
          <Filter className="w-4 h-4" /> Filters & Sort
        </button>

        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 bg-navy/40"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-lg p-5 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-navy">Filters</h3>
                  <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-navy/5"><X className="w-5 h-5 text-navy" /></button>
                </div>
                {Content}
                <button onClick={() => setOpen(false)} className="mt-6 w-full bg-navy text-white rounded py-3 font-medium">Show results</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
