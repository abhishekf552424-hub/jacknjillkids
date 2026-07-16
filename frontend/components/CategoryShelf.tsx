import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export default function CategoryShelf({
  categories,
  shape = "circle",
  title,
  subtitle,
}: {
  categories: Category[];
  shape?: "circle" | "square";
  title?: string | null;
  subtitle?: string | null;
}) {
  return (
    <section className="container py-16 md:py-20" data-testid="category-shelf">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold font-bold mb-2">Explore</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">{title ?? "Shop by Category"}</h2>
          {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            data-testid={`cat-tile-${c.slug}`}
            className="flex flex-col items-center gap-3 min-w-[120px] md:min-w-[160px] group"
          >
            <div
              className={`relative w-28 h-28 md:w-40 md:h-40 overflow-hidden bg-white shadow-soft transition-all group-hover:shadow-premium group-hover:-translate-y-1 ${
                shape === "square" ? "rounded-lg" : "rounded-full"
              }`}
            >
              {c.image_url && (
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  sizes="(min-width:768px) 160px, 112px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 ring-1 ring-inset ring-navy/5" />
            </div>
            <span className="text-sm font-medium text-navy text-center">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
