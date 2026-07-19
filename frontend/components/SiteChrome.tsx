"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Wraps Header/Footer so they're hidden on admin routes (Phase 3a: admin has its own shell).
export default function SiteChrome({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || "";
  const hide = pathname.startsWith("/admin");
  return (
    <>
      {!hide && header}
      <main className="min-h-[70vh]">{children}</main>
      {!hide && footer}
    </>
  );
}
