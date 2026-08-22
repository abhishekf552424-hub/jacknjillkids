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

  const { ids, action } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: false, error: "No products selected." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === "activate" || action === "deactivate") {
    const { error } = await admin
      .from("products")
      .update({ status: action === "activate" ? "active" : "draft", updated_at: new Date().toISOString() })
      .in("id", ids);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: ids.length });
  }

  if (action === "delete") {
    // Clean up dependent rows first, same as the single-product DELETE route.
    await admin.from("product_images").delete().in("product_id", ids);
    await admin.from("product_variants").delete().in("product_id", ids);
    const { error } = await admin.from("products").delete().in("id", ids);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, deleted: ids.length });
  }

  return NextResponse.json({ ok: false, error: "Unknown bulk action." }, { status: 400 });
}
