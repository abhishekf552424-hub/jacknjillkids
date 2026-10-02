import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { calcDiscountPct, formatINR } from "@/lib/utils";

/** Product tile from the approved mockup: photo on cream, one badge, name, price. */
export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]?.url;
  const price = product.base_price;
  const mrp = product.mrp;
  const discount = calcDiscountPct(mrp, price);
  const outOfStock = product.status === "out_of_stock";

  return (
    <Link
      href={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-premium transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream">
        {img && (
          <Image
            src={img}
            alt={product.alt_text || product.name}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {/* One badge only: the offer wins over "New" */}
        {discount > 0 && !outOfStock ? (
          <span className="absolute top-2.5 left-2.5 bg-brand-yellow text-ink text-[11px] leading-[14px] font-extrabold px-2 py-1 rounded-full">{discount}% off</span>
        ) : product.is_new_arrival && !outOfStock ? (
          <span className="absolute top-2.5 left-2.5 bg-success text-white text-[11px] leading-[14px] font-extrabold px-2 py-1 rounded-full">New</span>
        ) : null}
        {outOfStock && (
          <div className="absolute inset-0 bg-navy/40 flex items-center justify-center">
            <span className="bg-white text-navy text-xs font-extrabold px-3 py-1.5 rounded-full">Sold out</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3 pt-2.5 pb-3.5">
        <h3 className="text-sm leading-5 font-bold text-ink line-clamp-2">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-1.5">
          <span className="text-lg leading-6 font-extrabold text-ink">{formatINR(price)}</span>
          {mrp > price && <span className="text-[13px] text-muted line-through">{formatINR(mrp)}</span>}
        </div>
      </div>
    </Link>
  );
}
