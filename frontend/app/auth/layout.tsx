import type { Metadata } from "next";

// Private or per-user page: never in search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
