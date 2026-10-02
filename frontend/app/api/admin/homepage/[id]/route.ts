import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const Patch = z
  .object({
    title: z.string().max(200).nullable().optional(),
    subtitle: z.string().max(400).nullable().optional(),
    config: z.record(z.any()).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(0).max(1000).optional(),
  })
  .strict();

/** Edit one homepage section (only these fields; the type and id never change). */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await checkAdmin("homepage");
  if ("error" in g) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ ok: false, error: "Invalid section" }, { status: 400 });
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Some fields are not valid" }, { status: 400 });
  if (JSON.stringify(parsed.data.config ?? {}).length > 50_000) return NextResponse.json({ ok: false, error: "Too much content in one section" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("homepage_sections").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  revalidatePath("/"); // show the change on the homepage right away
  return NextResponse.json({ ok: true });
}
