"use client";

import Image from "next/image";

/**
 * Reusable brand loader — logo mark in a circular frame with a rotating
 * warm-gradient ring + gentle pulse. ONE loader used site-wide.
 *
 * Sizes:
 *  - "sm"  → 20px  (inline button spinner)
 *  - "md"  → 40px  (card/inline sections)
 *  - "lg"  → 88px  (full-page route transitions)
 */
export default function BrandLoader({
  size = "lg",
  label,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const px = size === "sm" ? 20 : size === "md" ? 40 : 88;
  return (
    <div className={`inline-flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div
        className="relative brand-loader"
        style={{ width: px, height: px }}
      >
        {/* Rotating warm-gradient ring */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full brand-loader-ring"
        />
        {/* Inner logo mark with subtle pulse */}
        <span
          aria-hidden="true"
          className="absolute inset-[10%] rounded-full bg-white shadow-soft overflow-hidden brand-loader-inner"
        >
          <Image
            src="/logo.png"
            alt=""
            fill
            sizes={`${px}px`}
            className="object-contain p-[6%]"
            priority={size === "lg"}
          />
        </span>
      </div>
      {label && <span className="text-xs uppercase tracking-widest text-muted font-bold">{label}</span>}
    </div>
  );
}
