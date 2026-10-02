import type { Metadata } from "next";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Jack & Jill Kolhapur — store address, phone & WhatsApp",
  description: "Visit Jack & Jill in Shahupuri, Kolhapur, or reach us by phone, WhatsApp or email for sizes, orders and exchanges.",
  alternates: { canonical: abs("/contact") },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
