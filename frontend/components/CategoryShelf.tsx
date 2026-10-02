import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import { HomeSection, SectionHeader, type Tone } from "./home/Section";

export default function CategoryShelf({
  categories,
  shape = "circle",
  title,
  subtitle,
  tone = "cream",
}: {
  tone?: Tone;
  categories: Category[];
  shape?: "circle" | "square";
  title?: string | null;
  subtitle?: string | null;
}) {
  return (
    <HomeSection tone={tone} testid="category-shelf">
      <SectionHeader eyebrow="Explore" title={title || "Shop by category"} subtitle={subtitle} href="/shop" linkText="Shop all" />
      <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            data-testid={`cat-tile-${c.slug}`}
            className="flex flex-col items-center gap-3 min-w-[120px] md:min-w-[160px] group"
          >
            <div
              className={`relative w-28 h-28 md:w-40 md:h-40 overflow-hidden bg-white shadow-soft transition-all group-hover:shadow-premium group-hover:-translate-y-1 ${
                shape === "square" ? "rounded-lg" : "rounded-full"
              } p-[3px] bg-brand-gradient`}
            >
              <div className={`relative w-full h-full overflow-hidden bg-white ${shape === "square" ? "rounded-md" : "rounded-full"}`}>
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    fill
                    sizes="(min-width:768px) 160px, 112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-navy text-center">{c.name}</span>
          </Link>
        ))}
      </div>
    </HomeSection>
  );
}
