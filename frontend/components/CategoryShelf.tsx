import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

const TINTS = ["bg-blush", "bg-sky", "bg-butter"];

/** "Shop by category" — rounded cards, 2 per row on phones (approved mockup). */
export default function CategoryShelf({
  categories,
  title,
  subtitle,
}: {
  categories: Category[];
  shape?: "circle" | "square";
  title?: string | null;
  subtitle?: string | null;
}) {
  if (!categories.length) return null;
  return (
    <section className="container py-10 md:py-16" data-testid="category-shelf">
      <h2 className="font-display text-2xl leading-8 md:text-4xl md:leading-tight text-navy">{title ?? "Shop by category"}</h2>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {categories.map((c, idx) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            data-testid={`cat-tile-${c.slug}`}
            className="group bg-white rounded-2xl p-3 md:p-4 shadow-soft hover:shadow-premium hover:-translate-y-0.5 transition-all flex flex-col gap-3"
          >
            <span className={`relative block aspect-[4/3] rounded-xl overflow-hidden ${TINTS[idx % TINTS.length]}`}>
              {c.image_url && (
                <Image
                  src={c.image_url}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 22vw, (min-width:640px) 30vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </span>
            <span className="font-display text-base leading-5 md:text-lg text-navy">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
