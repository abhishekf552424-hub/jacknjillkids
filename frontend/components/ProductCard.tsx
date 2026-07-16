import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { calcDiscountPct, formatINR } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]?.url || "https://images.unsplash.com/photo-1529776292731-c2246c65df5a?w=800";
  const price = product.base_price;
  const mrp = product.mrp;
  const discount = calcDiscountPct(mrp, price);
  const outOfStock = product.status === "out_of_stock";

  return (
    <Link
      href={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group block bg-white rounded p-3 shadow-soft hover:shadow-premium transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cream">
        <Image
          src={img}
          alt={product.alt_text || product.name}
          fill
          sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.is_new_arrival && (
          <span className="absolute top-3 left-3 bg-success text-white text-[10px] font-bold px-2.5 py-1 rounded-full">NEW</span>
        )}
        {discount > 0 && !outOfStock && (
          <span className="absolute top-3 right-3 bg-brand-gradient text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {discount}% OFF
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-navy/40 flex items-center justify-center">
            <span className="bg-white text-navy text-xs font-bold px-3 py-1.5 rounded-full">Out of stock</span>
          </div>
        )}
      </div>
      <div className="pt-3 px-1">
        <p className="text-xs text-muted uppercase tracking-wider">{product.brand ?? "Jack & Jill"}</p>
        <h3 className="mt-0.5 text-sm font-medium text-navy line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-navy">{formatINR(price)}</span>
          {mrp > price && <span className="text-xs text-muted line-through">{formatINR(mrp)}</span>}
        </div>
      </div>
    </Link>
  );
}
