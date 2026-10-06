import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { getSiteMode } from "@/lib/site-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Should this browser see the "Preview · Go live" bar? Only a verified admin, and only while the site is still "Coming soon". */
export async function GET() {
  const [admin, mode] = await Promise.all([checkAdmin(), getSiteMode()]);
  const preview = admin.ok && !mode.live;
  const res = NextResponse.json({ preview }, { headers: { "Cache-Control": "no-store" } });
  if (!preview) res.cookies.set("jj_preview", "", { path: "/", maxAge: 0 });
  return res;
}
