import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

/** A row of products: 2-up grid on phones (first 4), 3–4 up on larger screens. */
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
  if (!products.length) return null;
  const bg = tint === "blush" ? "bg-blush" : tint === "sky" ? "bg-sky" : "bg-cream";
  return (
    <section className={`${bg} py-10 md:py-16`} data-testid={`shelf-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="container">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl leading-8 md:text-4xl md:leading-tight text-navy">{title}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="shrink-0 text-sm font-bold text-doodle hover:text-ink underline-offset-4 hover:underline">
              See all
            </Link>
          )}
        </div>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {products.slice(0, 8).map((p, idx) => (
            <div key={p.id} className={idx >= 4 ? "hidden md:block" : undefined}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
