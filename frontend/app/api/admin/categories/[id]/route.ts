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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const { id: _drop, ...clean } = body;

  if (!clean.name || !String(clean.name).trim()) {
    return NextResponse.json({ ok: false, error: "Category name is required." }, { status: 400 });
  }
  if (clean.slug && !String(clean.slug).trim()) {
    return NextResponse.json({ ok: false, error: "Slug cannot be empty." }, { status: 400 });
  }

  const { error } = await admin.from("categories").update(clean).eq("id", id);
  if (error) {
    const friendly = error.code === "23505"
      ? "A category with this slug already exists. Please use a different name or slug."
      : error.message;
    return NextResponse.json({ ok: false, error: friendly }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("categories").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
