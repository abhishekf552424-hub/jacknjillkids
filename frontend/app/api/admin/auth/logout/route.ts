import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CHALLENGE_COOKIE, TWO_FA_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

// Clears the httpOnly admin cookies (the browser cannot delete them itself).
export async function POST() {
  const jar = await cookies();
  jar.delete(TWO_FA_COOKIE);
  jar.delete(CHALLENGE_COOKIE);
  return NextResponse.json({ ok: true });
}
