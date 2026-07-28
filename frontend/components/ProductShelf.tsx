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
        {/* Mobile: horizontal scroll row. Desktop: grid. */}
        <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {products.slice(0, 8).map((p) => (
            <div key={p.id} className="min-w-[65%] xs:min-w-[55%] snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
