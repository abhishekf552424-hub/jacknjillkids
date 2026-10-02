"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Check } from "lucide-react";
import { toast } from "sonner";
import { cart } from "@/lib/cart";
import { formatINR } from "@/lib/utils";
import { track } from "@/lib/track";
import { HomeSection, SectionHeader, Media, type Tone } from "./Section";

export type LookProduct = {
  id: string;
  slug: string;
  name: string;
  base_price: number;
  mrp: number;
  image: string | null;
  variants: { id: string; size: string | null; color: string | null; stock_qty: number; price_override: number | null }[];
};

const label = (v: LookProduct["variants"][number]) => [v.size, v.color].filter(Boolean).join(" / ") || "One size";

export default function ShopTheLook({ title, subtitle, config, products, tone }: { title?: string | null; subtitle?: string | null; config?: { eyebrow?: string; image?: string }; products: LookProduct[]; tone?: Tone }) {
  const items = products.filter((p) => p.variants.some((v) => v.stock_qty > 0)).slice(0, 4);
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((p) => [p.id, p.variants.find((v) => v.stock_qty > 0)!.id])),
  );
  const [added, setAdded] = useState(false);

  const lines = useMemo(
    () =>
      items.map((p) => {
        const v = p.variants.find((x) => x.id === picked[p.id]) ?? p.variants.find((x) => x.stock_qty > 0)!;
        return { p, v, price: Number(v.price_override ?? p.base_price), mrp: Number(p.mrp) };
      }),
    [items, picked],
  );
  if (items.length < 2) return null;

  const total = lines.reduce((s, l) => s + l.price, 0);
  const mrpTotal = lines.reduce((s, l) => s + Math.max(l.mrp, l.price), 0);

  const addAll = () => {
    for (const { p, v, price, mrp } of lines) {
      cart.add({
        variant_id: v.id,
        product_id: p.id,
        product_name: p.name,
        slug: p.slug,
        image: p.image ?? "",
        variant_label: label(v),
        price,
        mrp,
        quantity: 1,
        stock_qty: v.stock_qty,
      });
    }
    track("add_to_cart", lines.map(({ p, v, price }) => ({ id: p.id, name: p.name, price, quantity: 1, variant: label(v) })));
    toast.success(`Added ${lines.length} items to your bag`);
    setAdded(true);
    window.dispatchEvent(new CustomEvent("cart:open"));
  };

  return (
    <HomeSection tone={tone} testid="shop-the-look">
      <SectionHeader eyebrow={config?.eyebrow || "Complete outfits"} title={title || "Shop the look"} subtitle={subtitle} />
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.15fr_1fr] items-stretch">
        <Media src={config?.image || items[0]?.image} alt={title || "Shop the look"} className="w-full aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[420px] rounded-[26px]" sizes="(min-width:1024px) 55vw, 100vw" />
        <div className="grid gap-3.5 content-center">
          {lines.map(({ p, v, price }) => (
            <div key={p.id} className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-3">
              <Link href={`/product/${p.slug}`} className="shrink-0">
                <Media src={p.image} alt={p.name} className="w-20 h-20 md:w-[88px] md:h-[88px] rounded-[14px]" sizes="88px" />
              </Link>
              <div className="min-w-0 flex-1 grid gap-1.5">
                <Link href={`/product/${p.slug}`} className="font-display text-base md:text-[17px] text-navy leading-tight hover:underline line-clamp-2">
                  {p.name}
                </Link>
                {p.variants.filter((x) => x.stock_qty > 0).length > 1 ? (
                  <label className="text-xs text-muted flex items-center gap-2">
                    <span className="sr-only">Size for {p.name}</span>
                    <select
                      value={picked[p.id]}
                      onChange={(e) => {
                        setPicked({ ...picked, [p.id]: e.target.value });
                        setAdded(false);
                      }}
                      className="rounded-full border border-line bg-cream px-3 py-1.5 text-[13px] font-semibold text-navy outline-none focus:border-navy"
                    >
                      {p.variants
                        .filter((x) => x.stock_qty > 0)
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {label(x)}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <span className="text-[13px] text-muted">{label(v)}</span>
                )}
              </div>
              <b className="text-base md:text-[17px] text-navy tabular-nums">{formatINR(price)}</b>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-[15px] text-muted">
              Whole look <b className="font-display text-2xl text-navy tabular-nums">{formatINR(total)}</b>
              {mrpTotal > total && <s className="ml-2 tabular-nums">{formatINR(mrpTotal)}</s>}
            </p>
            <button onClick={addAll} className="inline-flex items-center gap-2 rounded-full bg-action hover:bg-action-hover text-white px-6 py-3.5 text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium">
              {added ? <Check className="w-4 h-4 pop" /> : <ShoppingBag className="w-4 h-4" />} {added ? "Added to bag" : `Add all ${lines.length} to bag`}
            </button>
          </div>
        </div>
      </div>
    </HomeSection>
  );
}
