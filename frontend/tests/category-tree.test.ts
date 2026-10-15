import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTree, flattenTree, descendantIds, pathLabel, parentProblem, visibleCategories } from "@/lib/category-tree";

const flat = [
  { id: "cl", parent_id: null, name: "Clothing", sort_order: 1, is_active: true },
  { id: "gi", parent_id: "cl", name: "Girls", sort_order: 2, is_active: true },
  { id: "bo", parent_id: "cl", name: "Boys", sort_order: 1, is_active: true },
  { id: "fr", parent_id: "gi", name: "Frocks", sort_order: 1, is_active: true },
  { id: "pf", parent_id: "fr", name: "Party frocks", sort_order: 1, is_active: true },
  { id: "to", parent_id: null, name: "Toys", sort_order: 2, is_active: false },
  { id: "rc", parent_id: "to", name: "RC toys", sort_order: 1, is_active: true },
];

test("tree of any depth, siblings in Order", () => {
  const t = buildTree(flat);
  assert.deepEqual(t.map((c) => c.id), ["cl", "to"]);
  assert.deepEqual(t[0].children.map((c) => c.id), ["bo", "gi"]);
  assert.equal(t[0].children[1].children[0].children[0].name, "Party frocks");
  assert.deepEqual(flattenTree(flat).map((r) => `${r.depth}:${r.cat.id}`), ["0:cl", "1:bo", "1:gi", "2:fr", "3:pf", "0:to", "1:rc"]);
});

test("descendants, paths and loop protection", () => {
  assert.deepEqual(descendantIds(flat, "cl").sort(), ["bo", "fr", "gi", "pf"]);
  assert.equal(pathLabel(flat, "pf"), "Clothing › Girls › Frocks › Party frocks");
  assert.equal(parentProblem(flat, "gi", "pf"), "A category can't go inside one of its own sub-categories.");
  assert.equal(parentProblem(flat, "gi", "gi"), "A category can't be its own parent.");
  assert.equal(parentProblem(flat, "gi", "to"), null);
  assert.equal(parentProblem(flat, null, "pf"), null);
  assert.match(parentProblem(flat, "gi", "nope") ?? "", /no longer exists/);
  // corrupt data (a loop) never hangs and every row still shows
  const loop = [{ id: "a", parent_id: "b", name: "A" }, { id: "b", parent_id: "a", name: "B" }];
  assert.equal(flattenTree(loop).length, 2);
  assert.deepEqual(descendantIds(loop, "a"), ["b"]);
});

test("switching a parent off hides its whole branch", () => {
  assert.deepEqual(visibleCategories(flat).map((c) => c.id).sort(), ["bo", "cl", "fr", "gi", "pf"]);
});
