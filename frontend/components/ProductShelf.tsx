import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import Rail from "./Rail";
import { HomeSection, SectionHeader, type Tone } from "./home/Section";

export default function ProductShelf({
  title,
  subtitle,
  products,
  viewAllHref,
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
      <Rail label={title} itemClassName="w-[66%] sm:w-[44%] md:w-[31.5%] lg:w-[23.6%]" gapClassName="gap-4 md:gap-6">
        {products.slice(0, 12).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </Rail>
    </HomeSection>
  );
}
