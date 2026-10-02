import type { Metadata } from "next";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your Jack & Jill order with your order number and the email or phone used at checkout.",
  alternates: { canonical: abs("/track") },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
