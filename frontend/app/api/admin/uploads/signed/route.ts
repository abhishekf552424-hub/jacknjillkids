import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only signed upload URL for the 'media' public bucket.
// The client PUTs the file to the returned signedUrl and we return the final public URL.
export async function POST(req: Request) {
  const g = await checkAdmin("products");
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const { filename, folder = "uploads" } = await req.json().catch(() => ({}));
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  // Whitelist folder to prevent path traversal
  const safeFolder = safeFolderName(folder);
  const ext = String(filename).split(".").pop()?.toLowerCase() || "";
  // Only pictures and short videos can be uploaded (SVG only for the logo).
  const allowed = ["jpg", "jpeg", "png", "webp", "gif", "avif", "mp4", "webm", "mov"];
  if (!allowed.includes(ext) && !(ext === "svg" && safeFolderName(folder) === "branding")) {
    return NextResponse.json({ error: "Please upload a JPG, PNG, WebP or GIF picture, or an MP4/WebM video." }, { status: 400 });
  }
  const key = `${safeFolder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("media").createSignedUploadUrl(key);
  if (error || !data) {
    console.error("[uploads/signed]", error?.message);
    return NextResponse.json({ error: "Upload could not start. Please try again." }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("media").getPublicUrl(key);
  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: key,
    publicUrl: pub.publicUrl,
    contentType: TYPES[ext] || "application/octet-stream",
  });
}

const TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif",
  svg: "image/svg+xml", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
};

function safeFolderName(folder: unknown) {
  return String(folder ?? "uploads").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "uploads";
}
