import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";
import Rail from "./Rail";
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
  const round = shape === "square" ? "rounded-[22px]" : "rounded-full";
  const inner = shape === "square" ? "rounded-[19px]" : "rounded-full";
  return (
    <HomeSection tone={tone} testid="category-shelf">
      <SectionHeader eyebrow="Explore" title={title || "Shop by category"} subtitle={subtitle} href="/shop" linkText="Shop all" />
      <Rail label={title || "Shop by category"} itemClassName="w-[30%] sm:w-[22%] md:w-[16%] lg:w-[12.5%]" gapClassName="gap-4 md:gap-6">
        {categories.map((c) => (
          <Link key={c.id} href={`/category/${c.slug}`} data-testid={`cat-tile-${c.slug}`} className="flex flex-col items-center gap-3 group active:scale-[0.97] transition-transform">
            <div className={`relative w-full aspect-square p-[3px] bg-brand-gradient shadow-soft transition-all duration-300 ease-premium group-hover:shadow-premium group-hover:-translate-y-1.5 ${round}`}>
              <div className={`relative w-full h-full overflow-hidden bg-white ${inner}`}>
                {c.image_url && (
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    fill
                    sizes="(min-width:1024px) 160px, (min-width:768px) 16vw, 30vw"
                    className="object-cover transition-transform duration-700 ease-premium group-hover:scale-110"
                  />
                )}
              </div>
            </div>
            <span className="text-sm font-semibold text-navy text-center leading-tight transition-colors group-hover:text-action">{c.name}</span>
          </Link>
        ))}
      </Rail>
    </HomeSection>
  );
}
