import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { HomeSection, SectionHeader, type Tone } from "./home/Section";

export default function ProductShelf({
  title,
  subtitle,
  products,
  viewAllHref,
  tint,
  tone = "cream",
  eyebrow,
}: {
  title: string;
  subtitle?: string | null;
  products: Product[];
  viewAllHref?: string;
  tint?: "cream" | "blush" | "sky";
  tone?: Tone;
  eyebrow?: string;
}) {
  if (!products.length) return null;
  return (
    <HomeSection tone={tone} testid={`shelf-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <SectionHeader eyebrow={eyebrow || "Curated"} title={title} subtitle={subtitle} href={viewAllHref} />
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
    </HomeSection>
  );
}
