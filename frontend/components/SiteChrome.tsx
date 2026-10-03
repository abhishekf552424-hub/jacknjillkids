"use client";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

// Wraps Header/Footer + optional support widget so they're hidden on admin routes.
export default function SiteChrome({ header, footer, support, children }: { header: ReactNode; footer: ReactNode; support?: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || "";
  const hide = pathname.startsWith("/admin");
  // Decided once, on the first render only: the loader is part of the page's
  // HTML, plays on every fresh load / refresh, and never replays on in-site navigation.
  const [boot] = useState(() => !hide);
  return (
    <>
      {boot && (
        <div className="jj-boot" aria-hidden="true">
          <span className="jj-dots" style={{ ["--d" as string]: "16px" }}>
            <span style={{ background: "#EA4137" }} />
            <span style={{ background: "#F38838" }} />
            <span style={{ background: "#FCD325" }} />
          </span>
          <span className="jj-boot-name">Jack &amp; Jill</span>
        </div>
      )}
      {!hide && header}
      <main className="min-h-[70vh]">{children}</main>
      {!hide && footer}
      {!hide && support}
    </>
  );
}
