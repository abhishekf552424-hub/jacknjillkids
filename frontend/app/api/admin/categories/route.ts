import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in", status: 401 };
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["super_admin", "content_manager"].includes(p.role)) return { error: "Forbidden", status: 403 };
  return { user };
}

export async function POST(req: Request) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const body = await req.json();
  const admin = createAdminClient();
  const { id: _drop, ...clean } = body;

  if (!clean.name || !String(clean.name).trim()) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }

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
  return NextResponse.json({ ok: true, id: data.id, slug: candidate });
}
