"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { Category, AgeGroup } from "@/lib/types";

type Chip = { key: string; label: string; value?: string };

export default function AppliedFilters({
  current,
  categories,
  ageGroups,
}: {
  current: Record<string, string | undefined>;
  categories: Category[];
  ageGroups: AgeGroup[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const chips: Chip[] = [];
  if (current.category) {
    const cat = categories.find((c) => c.slug === current.category);
    if (cat) chips.push({ key: "category", label: cat.name });
  }
  if (current.age) {
    const ag = ageGroups.find((a) => a.slug === current.age);
    if (ag) chips.push({ key: "age", label: ag.label });
  }
  if (current.gender) chips.push({ key: "gender", label: current.gender[0].toUpperCase() + current.gender.slice(1) });
  if (current.min) chips.push({ key: "min", label: `Min ₹${current.min}` });
  if (current.max) chips.push({ key: "max", label: `Max ₹${current.max}` });
  if (current.q) chips.push({ key: "q", label: `“${current.q}”` });
  if (current.sort && current.sort !== "") chips.push({ key: "sort", label: `Sort: ${current.sort.replace(/_/g, " ")}` });

  if (chips.length === 0) return null;

  const remove = (key: string) => {
    const q = new URLSearchParams(params.toString());
    q.delete(key);
    q.delete("page");
    router.push(`/shop?${q.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="applied-filters">
      <span className="text-xs uppercase tracking-widest text-muted font-bold">Applied:</span>
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => remove(c.key)}
          className="inline-flex items-center gap-1.5 bg-white border border-navy/10 rounded-full pl-3 pr-2 py-1 text-xs font-medium text-navy hover:border-gold hover:text-gold transition-colors group"
          data-testid={`applied-chip-${c.key}`}
        >
          {c.label}
          <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
        </button>
      ))}
      <Link
        href="/shop"
        className="text-xs text-muted underline hover:text-navy ml-2"
        data-testid="applied-clear-all"
      >
        Clear all
      </Link>
    </div>
  );
}
