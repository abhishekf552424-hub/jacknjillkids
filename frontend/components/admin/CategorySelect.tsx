"use client";

import { useMemo } from "react";
import { flattenTree, descendantIds, pathLabel, type CatLike } from "@/lib/category-tree";

/**
 * Dropdown of every category, any depth, shown as an indented tree:
 *   Clothing
 *   └ Girls
 *     └ Frocks
 * When `forId` is given, that category and its own sub-categories are left
 * out, so a loop can't be picked.
 */
export default function CategorySelect({
  categories,
  value,
  onChange,
  forId,
  topLabel = "— Top level (no parent) —",
  className = "",
  id,
  ariaLabel,
}: {
  categories: CatLike[];
  value: string | null;
  onChange: (id: string | null) => void;
  forId?: string | null;
  topLabel?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}) {
  const rows = useMemo(() => {
    const blocked = new Set(forId ? [forId, ...descendantIds(categories, forId)] : []);
    return flattenTree(categories.filter((c) => !c.id.startsWith("tmp-"))).filter((r) => !blocked.has(r.cat.id));
  }, [categories, forId]);
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      title={value ? pathLabel(categories, value) : topLabel}
      className={className}
    >
      <option value="">{topLabel}</option>
      {rows.map(({ cat, depth }) => (
        <option key={cat.id} value={cat.id}>
          {depth ? "   ".repeat(depth - 1) + " └ " : ""}
          {cat.name || "(no name)"}
          {cat.is_active === false ? " (off)" : ""}
        </option>
      ))}
    </select>
  );
}
