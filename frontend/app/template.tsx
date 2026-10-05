"use client";

import { useEffect } from "react";

// First landing shows the page straight away (no fade while the site loads);
// every later page change fades softly in.
let landed = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const animate = landed;
  useEffect(() => {
    landed = true;
  }, []);
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}
