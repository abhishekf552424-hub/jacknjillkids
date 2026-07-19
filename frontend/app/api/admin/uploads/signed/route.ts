import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only signed upload URL for the 'media' public bucket.
// The client PUTs the file to the returned signedUrl and we return the final public URL.
export async function POST(req: Request) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { filename, folder = "uploads", contentType } = await req.json();
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  // Whitelist folder to prevent path traversal
  const safeFolder = String(folder).replace(/[^a-z0-9/_-]/gi, "").slice(0, 40) || "uploads";
  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const key = `${safeFolder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("media").createSignedUploadUrl(key);
  if (error || !data) return NextResponse.json({ error: error?.message || "signed URL failed" }, { status: 500 });

  const { data: pub } = admin.storage.from("media").getPublicUrl(key);
  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: key,
    publicUrl: pub.publicUrl,
    contentType: contentType || "application/octet-stream",
  });
}
