"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Wraps Header/Footer + optional support widget so they're hidden on admin routes.
export default function SiteChrome({ header, footer, support, children }: { header: ReactNode; footer: ReactNode; support?: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || "";
  const hide = pathname.startsWith("/admin");
  return (
    <>
      {!hide && header}
      <main className="min-h-[70vh]">{children}</main>
      {!hide && footer}
      {!hide && support}
    </>
  );
}
