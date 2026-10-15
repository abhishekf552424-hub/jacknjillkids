import { NextResponse } from "next/server";
import { refreshSite } from "@/lib/refresh";
import { pickEditable } from "@/lib/pick";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parentProblem } from "@/lib/category-tree";

async function requireAdmin() {
  return checkAdmin("categories");
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const body = await req.json();
  const admin = createAdminClient();
  const clean: Record<string, any> = pickEditable("categories", body);

  if (!clean.name || !String(clean.name).trim()) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }

  clean.name = String(clean.name).trim();
  if (!clean.parent_id) clean.parent_id = null;
  const { data: all } = await admin.from("categories").select("id, parent_id, name");
  const bad = parentProblem(all ?? [], null, clean.parent_id);
  if (bad) return NextResponse.json({ ok: false, error: bad }, { status: 400 });

  const baseSlug = String(clean.slug || "").trim();
  if (!baseSlug) {
    return NextResponse.json({ ok: false, error: "Category name produced an empty slug — please use letters or numbers." }, { status: 400 });
  }

  // Auto-uniquify the slug if it collides with an existing one (e.g. same name
  // as an existing category), instead of failing with a raw DB error.
  let candidate = baseSlug;
  let suffix = 2;
  for (let attempts = 0; attempts < 20; attempts++) {
    const { data: existing } = await admin.from("categories").select("id").eq("slug", candidate).maybeSingle();
    if (!existing) break;
    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }
  clean.slug = candidate;

  const { data, error } = await admin.from("categories").insert(clean).select("id").single();
  if (error) {
    const friendly = error.code === "23505"
      ? "A category with this name/slug already exists. Please use a different name."
      : error.message;
    return NextResponse.json({ ok: false, error: friendly }, { status: 400 });
  }
  refreshSite();
  return NextResponse.json({ ok: true, id: data.id, slug: candidate });
}
