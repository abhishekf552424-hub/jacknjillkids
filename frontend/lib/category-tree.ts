/**
 * Category tree helpers, shared by the admin panel and the shop.
 *
 * Categories form a tree of any depth through parent_id
 * (e.g. Clothing › Girls › Frocks › Party frocks). Everything here works on
 * the flat list straight from the database, so no page has to care how deep
 * the tree goes.
 */

export type CatLike = {
  id: string;
  parent_id: string | null;
  name: string;
  sort_order?: number | null;
  is_active?: boolean;
};

export type TreeNode<T extends CatLike> = T & { children: TreeNode<T>[] };

const bySortThenName = (a: CatLike, b: CatLike) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);

/** id → direct children, each list sorted by Order then name. */
export function childrenMap<T extends CatLike>(flat: T[]): Map<string | null, T[]> {
  const ids = new Set(flat.map((c) => c.id));
  const m = new Map<string | null, T[]>();
  for (const c of flat) {
    // A parent that isn't in the list (deleted, or filtered out) → treat as top level.
    const key = c.parent_id && ids.has(c.parent_id) && c.parent_id !== c.id ? c.parent_id : null;
    if (!m.has(key)) m.set(key, []);
    m.get(key)!.push(c);
  }
  for (const list of m.values()) list.sort(bySortThenName);
  return m;
}

/** Nested tree. Safe against bad data: a loop in parent_id can never hang it. */
export function buildTree<T extends CatLike>(flat: T[]): TreeNode<T>[] {
  const kids = childrenMap(flat);
  const seen = new Set<string>();
  const walk = (parent: string | null): TreeNode<T>[] =>
    (kids.get(parent) ?? [])
      .filter((c) => !seen.has(c.id) && (seen.add(c.id), true))
      .map((c) => ({ ...c, children: walk(c.id) }));
  const roots = walk(null);
  // Rows caught in a parent loop are never reached from the top: show them at the top level.
  const lost = flat.filter((c) => !seen.has(c.id));
  for (const c of lost) if (!seen.has(c.id)) { seen.add(c.id); roots.push({ ...c, children: walk(c.id) }); }
  return roots;
}

/** The tree as a flat list in display order, with each row's depth (0 = top level). */
export function flattenTree<T extends CatLike>(flat: T[]): { cat: T; depth: number; hasChildren: boolean }[] {
  const out: { cat: T; depth: number; hasChildren: boolean }[] = [];
  const walk = (nodes: TreeNode<T>[], depth: number) => {
    for (const n of nodes) {
      const { children, ...cat } = n;
      out.push({ cat: cat as unknown as T, depth, hasChildren: children.length > 0 });
      walk(children, depth + 1);
    }
  };
  walk(buildTree(flat), 0);
  return out;
}

/** Every category below `id` (children, grandchildren, …), not including `id`. */
export function descendantIds(flat: CatLike[], id: string): string[] {
  const kids = childrenMap(flat);
  const out: string[] = [];
  const seen = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    for (const c of kids.get(stack.pop()!) ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c.id);
      stack.push(c.id);
    }
  }
  return out;
}

/** Ancestors from the top level down to `id` (inclusive). */
export function pathTo<T extends CatLike>(flat: T[], id: string | null | undefined): T[] {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const out: T[] = [];
  const seen = new Set<string>();
  let cur = id ? byId.get(id) : undefined;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return out;
}

/** "Clothing › Girls › Frocks" */
export function pathLabel(flat: CatLike[], id: string | null | undefined, sep = " › "): string {
  return pathTo(flat, id).map((c) => c.name).join(sep);
}

/**
 * Why `newParentId` can't be the parent of `id`, or null when it's fine.
 * Blocks a category under itself or under one of its own sub-categories
 * (that would make a loop and hide the whole branch).
 */
export function parentProblem(flat: CatLike[], id: string | null | undefined, newParentId: string | null | undefined): string | null {
  if (!newParentId) return null;
  if (!flat.some((c) => c.id === newParentId)) return "The chosen parent category no longer exists. Please pick another.";
  if (!id) return null;
  if (newParentId === id) return "A category can't be its own parent.";
  if (descendantIds(flat, id).includes(newParentId)) return "A category can't go inside one of its own sub-categories.";
  return null;
}

/**
 * Only the categories a shopper may see: active, and every parent above them
 * active too. Switching off "Clothing" hides all of Clothing's branch.
 */
export function visibleCategories<T extends CatLike>(flat: T[]): T[] {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const memo = new Map<string, boolean>();
  const ok = (c: T, guard = 0): boolean => {
    if (memo.has(c.id)) return memo.get(c.id)!;
    let v = c.is_active !== false;
    if (v && c.parent_id && c.parent_id !== c.id) {
      const p = byId.get(c.parent_id);
      v = !!p && guard < 50 && ok(p, guard + 1);
    }
    memo.set(c.id, v);
    return v;
  };
  return flat.filter((c) => ok(c));
}
