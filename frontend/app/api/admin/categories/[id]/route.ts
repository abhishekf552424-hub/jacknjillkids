import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { pickEditable } from "@/lib/pick";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parentProblem } from "@/lib/category-tree";

async function requireAdmin() {
  return checkAdmin("categories");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const clean: Record<string, any> = pickEditable("categories", body);

  // A full edit must keep a name; a quick switch (e.g. bulk Activate) only sends is_active.
  if ("name" in clean && !String(clean.name ?? "").trim()) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }
  if (clean.slug && !String(clean.slug).trim()) {
    return NextResponse.json({ ok: false, error: "Slug cannot be empty." }, { status: 400 });
  }

  if (Object.keys(clean).length === 0) return NextResponse.json({ ok: false, error: "Nothing to save." }, { status: 400 });
  if (typeof clean.name === "string") clean.name = clean.name.trim();
  if ("parent_id" in clean) {
    if (!clean.parent_id) clean.parent_id = null;
    const { data: all } = await admin.from("categories").select("id, parent_id, name");
    const bad = parentProblem(all ?? [], id, clean.parent_id);
    if (bad) return NextResponse.json({ ok: false, error: bad }, { status: 400 });
  }
  const { error } = await admin.from("categories").update(clean).eq("id", id);
  if (error) {
    const friendly = error.code === "23505"
      ? "A category with this slug already exists. Please use a different name or slug."
      : error.message;
    return NextResponse.json({ ok: false, error: friendly }, { status: 400 });
  }
  refreshSite();
  return NextResponse.json({ ok: true });
}

/**
 * Deleting a category never strands anything:
 * its sub-categories move up one level (to its parent), and its products move
 * to the parent category too. At the top level, sub-categories become top-level
 * and products simply lose this category (they stay in the shop and in any
 * other categories they belong to).
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const admin = createAdminClient();
  const { data: cat } = await admin.from("categories").select("id, parent_id").eq("id", id).maybeSingle();
  if (!cat) return NextResponse.json({ ok: true });
  const up = cat.parent_id ?? null;

  const { error: e1 } = await admin.from("categories").update({ parent_id: up }).eq("parent_id", id);
  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 400 });

  if (up) {
    const [{ data: primary }, { data: extra }] = await Promise.all([
      admin.from("products").select("id").eq("category_id", id),
      admin.from("product_categories").select("product_id").eq("category_id", id),
    ]);
    const pids = Array.from(new Set([...(primary ?? []).map((r: any) => r.id), ...(extra ?? []).map((r: any) => r.product_id)]));
    if (pids.length) {
      await admin.from("product_categories").upsert(pids.map((product_id) => ({ product_id, category_id: up })), { onConflict: "product_id,category_id", ignoreDuplicates: true });
    }
    await admin.from("products").update({ category_id: up }).eq("category_id", id);
  }

  const { error } = await admin.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  refreshSite();
  return NextResponse.json({ ok: true, moved_to: up });
}
