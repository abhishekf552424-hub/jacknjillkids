import { NextResponse } from "next/server";
import { pickEditable } from "@/lib/pick";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  return checkAdmin("coupons");
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const body = pickEditable("coupons", await req.json().catch(() => ({})));
  if (body.code !== undefined) {
    body.code = String(body.code).trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,40}$/.test(body.code as string)) return NextResponse.json({ ok: false, error: "Coupon code: use 2–40 letters, numbers or dashes" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("coupons").update(body).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await requireAdmin();
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
