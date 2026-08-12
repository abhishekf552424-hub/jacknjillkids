"use client";

/**
 * Client-side image compression run automatically before every admin upload.
 * Resizes to a generous max dimension and re-encodes as WebP at high quality
 * — this removes invisible excess resolution/bloat (e.g. an uncompressed
 * 12MP phone photo) while keeping visual quality essentially identical for
 * on-site display, dramatically reducing Supabase Storage usage.
 *
 * Safe by design: falls back to the original file untouched if anything
 * about the compression step fails, isn't supported, or doesn't actually
 * help — it never blocks or corrupts an upload.
 */

const MAX_DIMENSION = 2000; // px on the longer side — comfortably above any on-site display size
const WEBP_QUALITY = 0.85; // high quality; visually near-lossless, large size reduction
const SKIP_BELOW_BYTES = 150 * 1024; // don't bother compressing already-small files

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file; // videos etc. pass through untouched
  if (file.type === "image/gif") return file; // avoid flattening animated GIFs to one frame
  if (file.size < SKIP_BELOW_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    // Only use the compressed result if it's actually smaller — protects
    // against rare edge cases (e.g. very simple/flat images) where WebP
    // re-encoding could end up larger than a well-optimized original.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}
