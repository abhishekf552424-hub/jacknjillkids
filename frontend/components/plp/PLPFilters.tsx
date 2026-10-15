"use client";

import Link from "next/link";
import { plpHref } from "@/lib/plp-url";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Filter, X } from "lucide-react";
import { buildTree, pathTo } from "@/lib/category-tree";
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
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(current.min ?? "");
  const [max, setMax] = useState(current.max ?? "");

  const tree = buildTree(categories) as Category[];
  const currentCat = categories.find((c) => c.slug === current.category);
  // Open the branch that leads to the chosen category; others stay folded.
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(currentCat ? pathTo(categories, currentCat.id).map((c) => c.id) : []));
  const toggleOpen = (id: string) => setOpenIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const renderCat = (c: Category, depth: number): React.ReactNode => {
    const kids = c.children ?? [];
    const on = current.category === c.slug;
    const open = openIds.has(c.id);
    return (
      <li key={c.id}>
        <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
          <button
            data-testid={`filter-cat-${c.slug}`}
            onClick={() => setParam("category", c.slug)}
            aria-current={on ? "true" : undefined}
            className={`flex-1 min-w-0 text-left text-sm py-1.5 px-2 rounded-md transition-colors truncate ${on ? "bg-gold/10 text-navy font-bold" : depth ? "text-ink/80 hover:bg-navy/5" : "text-navy/80 hover:bg-navy/5"}`}
          >
            {c.name}
          </button>
          {kids.length > 0 && (
            <button onClick={() => toggleOpen(c.id)} aria-expanded={open} aria-label={`${open ? "Hide" : "Show"} ${c.name} types`} className="w-8 h-8 shrink-0 grid place-items-center text-muted hover:text-navy">
              <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
        {open && kids.length > 0 && (
          <ul className="border-l border-navy/10 ml-3">
            {kids.map((k) => renderCat(k, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const setParam = (key: string, val: string | null) => {
    start(() => router.push(plpHref(current, { [key]: val })));
  };

  const Content = (
    <div className="space-y-5">
      <div className="rounded-lg border border-navy/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-navy mb-3">Sort by</p>
        <select
          data-testid="filter-sort"
          value={current.sort ?? ""}
          onChange={(e) => setParam("sort", e.target.value)}
          className="w-full bg-white border border-navy/10 rounded-md px-3 py-2 text-sm text-navy focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
        >
          {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-navy/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-navy mb-3">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => setParam("category", null)}
            className={`block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors ${!current.category ? "bg-gold/10 text-navy font-bold" : "text-navy/80 hover:bg-navy/5"}`}
          >
            All
          </button>
          <ul className="space-y-0.5">
            {tree.map((c) => renderCat(c, 0))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-navy/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-navy mb-3">Age Group</p>
        <div className="flex flex-wrap gap-2">
          {ageGroups.map((a) => (
            <button
              key={a.id}
              onClick={() => setParam("age", current.age === a.slug ? null : a.slug)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                current.age === a.slug
                  ? "bg-navy text-white border-navy shadow-soft"
                  : "bg-white text-navy border-navy/10 hover:border-gold hover:text-gold-text"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-navy/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-navy mb-3">Gender</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.v}
              onClick={() => setParam("gender", current.gender === g.v ? null : g.v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                current.gender === g.v ? "bg-navy text-white border-navy shadow-soft" : "bg-white text-navy border-navy/10 hover:border-gold"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-navy/10 bg-white p-4">
        <p className="text-[11px] uppercase tracking-widest font-bold text-navy mb-3">Price (₹)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-full bg-white border border-navy/10 rounded-md px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-full bg-white border border-navy/10 rounded-md px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>
        <button
          onClick={() => {
            start(() => router.push(plpHref(current, { min: min || null, max: max || null })));
          }}
          className="mt-3 w-full bg-navy text-white rounded-md px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Apply
        </button>
      </div>

      <Link
        href="/shop"
        className="block text-center text-xs text-muted underline hover:text-navy transition-colors"
        data-testid="filter-clear-all"
      >
        Clear all filters
      </Link>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block bg-white/50 rounded-lg p-5 border border-navy/5 h-fit sticky top-[calc(var(--hdr-h,0px)+16px)] transition-[top] duration-300">
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
