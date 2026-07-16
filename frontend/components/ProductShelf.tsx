import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { ArrowRight } from "lucide-react";

export default function ProductShelf({
  title,
  subtitle,
  products,
  viewAllHref,
  tint,
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  viewAllHref?: string;
  tint?: "cream" | "blush" | "sky";
}) {
  const bg = tint === "blush" ? "bg-blush" : tint === "sky" ? "bg-sky" : "bg-cream";
  return (
    <section className={`${bg} py-16 md:py-20`} data-testid={`shelf-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="container">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Curated</p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">{title}</h2>
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-navy hover:text-gold transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
