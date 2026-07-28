"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Truck, ShieldCheck, RotateCcw, Star, ChevronDown, Ticket, Check } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { calcDiscountPct, formatINR } from "@/lib/utils";
import { cart } from "@/lib/cart";
import { toast } from "sonner";

export default function PDPClient({ product, reviews }: { product: Product; reviews: any[] }) {
  const variants = (product.variants ?? []) as ProductVariant[];
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(
    new Map(variants.filter((v) => v.color).map((v) => [v.color!, v.color_hex ?? "#ddd"])).entries(),
  );
  const [size, setSize] = useState<string | undefined>(sizes[0]);
  const [color, setColor] = useState<string | undefined>(colors[0]?.[0]);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openDesc, setOpenDesc] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeVariant = useMemo(() => {
    return (
      variants.find((v) => (!size || v.size === size) && (!color || v.color === color)) ||
      variants[0]
    );
  }, [variants, size, color]);

  const price = activeVariant?.price_override ?? product.base_price;
  const mrp = product.mrp;
  const discount = calcDiscountPct(mrp, price);
  const oos = !activeVariant || activeVariant.stock_qty <= 0;

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const coupons = (product as any).eligible_coupon_codes as string[] | undefined;

  const images = product.images && product.images.length ? product.images : [{ url: "https://images.unsplash.com/photo-1529776292731-c2246c65df5a?w=1000", alt_text: product.name, id: "x", sort_order: 0 } as any];

  const addToCart = () => {
    if (!activeVariant || oos) return;
    cart.add({
      variant_id: activeVariant.id,
      product_id: product.id,
      product_name: product.name,
      slug: product.slug,
      image: images[0]?.url ?? "",
      variant_label: [activeVariant.size, activeVariant.color].filter(Boolean).join(" / ") || "Default",
      price,
      mrp,
      quantity: qty,
      stock_qty: activeVariant.stock_qty,
    });
    toast.success("Added to bag", { description: `${qty} × ${product.name}` });
    window.dispatchEvent(new CustomEvent("cart:open"));
  };

  const checkPin = async () => {
    if (!pincode) return;
    const r = await fetch(`/api/pincode?code=${pincode}`);
    const d = await r.json();
    if (d.serviceable) setPinResult(`Delivery to ${d.city}, ${d.state} in ~${d.est_delivery_days} days. ${d.cod_available ? "COD available." : "COD not available."}`);
    else setPinResult("Sorry, we don't ship to this pincode yet.");
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(`Coupon ${code} copied`, { description: "Apply it at checkout" });
      setTimeout(() => setCopiedCode(null), 1800);
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
      {/* Gallery */}
      <div>
        <div
          className="relative aspect-square rounded-lg overflow-hidden bg-white group cursor-zoom-in"
          onMouseEnter={() => setZoom((z) => ({ ...z, on: true }))}
          onMouseLeave={() => setZoom({ on: false, x: 50, y: 50 })}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setZoom({ on: true, x, y });
          }}
        >
          <Image
            src={images[imgIdx]?.url}
            alt={images[imgIdx]?.alt_text || product.name}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-500"
            style={zoom.on ? { transform: "scale(1.75)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-brand-gradient text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-soft">{discount}% OFF</span>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar snap-x">
          {images.map((img, i) => (
            <button
              key={img.id}
              data-testid={`gallery-thumb-${i}`}
              onClick={() => setImgIdx(i)}
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 shrink-0 snap-start transition-all ${i === imgIdx ? "border-gold shadow-soft" : "border-transparent hover:border-navy/20"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold">{product.brand ?? "Jack & Jill"}</p>
        <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight mt-2">{product.name}</h1>

        {reviews.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-gold">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="w-4 h-4" fill={avgRating >= n ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-sm text-muted">{avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
          </div>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold text-navy">{formatINR(price)}</span>
          {mrp > price && <span className="text-muted line-through">{formatINR(mrp)}</span>}
          {discount > 0 && <span className="text-success text-sm font-bold">You save {formatINR(mrp - price)}</span>}
        </div>
        <p className="text-xs text-muted mt-1">Inclusive of all taxes</p>

        {product.short_description && <p className="mt-5 text-ink leading-relaxed">{product.short_description}</p>}

        {/* Color */}
        {colors.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-bold text-navy mb-2">Color: <span className="text-muted font-normal">{color}</span></p>
            <div className="flex flex-wrap gap-2">
              {colors.map(([name, hex]) => (
                <button
                  key={name}
                  data-testid={`variant-color-${name}`}
                  onClick={() => setColor(name)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${color === name ? "border-navy scale-110 shadow-soft" : "border-navy/10 hover:scale-105"}`}
                  style={{ background: hex }}
                  aria-label={name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        {sizes.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-navy">Size: <span className="text-muted font-normal">{size}</span></p>
              {product.size_chart_url && <a href={product.size_chart_url} target="_blank" rel="noreferrer" className="text-xs underline text-gold">Size chart</a>}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const stocked = variants.some((v) => v.size === s && (!color || v.color === color) && v.stock_qty > 0);
                return (
                  <button
                    key={s}
                    data-testid={`variant-size-${s}`}
                    disabled={!stocked}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] px-3 py-2 text-sm font-bold rounded-md border transition-all ${
                      size === s ? "bg-navy text-white border-navy shadow-soft" : "bg-white text-navy border-navy/10 hover:border-gold"
                    } ${!stocked ? "opacity-40 cursor-not-allowed line-through hover:border-navy/10" : ""}`}
                    aria-label={stocked ? s : `${s} — out of stock`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Coupon chips */}
        {coupons && coupons.length > 0 && (
          <div className="mt-6 rounded-lg border border-gold/30 bg-gold/5 p-4" data-testid="pdp-coupons">
            <p className="text-sm font-bold text-navy mb-2 flex items-center gap-2"><Ticket className="w-4 h-4 text-gold" /> Available offers on this product</p>
            <div className="flex flex-wrap gap-2">
              {coupons.map((code) => (
                <button
                  key={code}
                  onClick={() => copyCode(code)}
                  data-testid={`pdp-coupon-${code}`}
                  className="inline-flex items-center gap-1.5 bg-white border border-dashed border-gold rounded-full pl-3 pr-2 py-1 text-xs font-bold text-navy hover:bg-gold hover:text-white transition-colors"
                >
                  {code}
                  {copiedCode === code ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-medium opacity-70">Tap to copy</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Qty + Add */}
        <div className="mt-8 flex gap-3">
          <div className="flex items-center border border-navy/10 rounded-full bg-white">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 text-navy hover:bg-navy/5 rounded-full">−</button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button onClick={() => setQty(Math.min(qty + 1, activeVariant?.stock_qty ?? 1))} className="w-10 h-10 text-navy hover:bg-navy/5 rounded-full">+</button>
          </div>
          <button
            data-testid="add-to-cart-btn"
            disabled={oos}
            onClick={addToCart}
            className="flex-1 bg-navy text-white rounded-md px-6 py-3 font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" /> {oos ? "Out of stock" : "Add to Bag"}
          </button>
          <button aria-label="Wishlist" className="w-12 border-2 border-gold text-gold rounded-md flex items-center justify-center hover:bg-gold hover:text-white transition-colors">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Pincode check */}
        <div className="mt-6 bg-white rounded-lg p-4 border border-navy/10">
          <p className="text-sm font-bold text-navy mb-2 flex items-center gap-2"><Truck className="w-4 h-4 text-gold" /> Delivery estimate</p>
          <div className="flex gap-2">
            <input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              maxLength={6}
              placeholder="Enter pincode"
              className="flex-1 bg-cream border border-navy/10 rounded-md px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
            <button onClick={checkPin} className="bg-navy text-white rounded-md px-4 text-sm font-bold hover:opacity-90 transition-opacity">Check</button>
          </div>
          {pinResult && <p className="text-xs text-muted mt-2">{pinResult}</p>}
        </div>

        {/* Trust badges — same lucide icons as homepage TrustStrip */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: ShieldCheck, l: "Skin-Safe" },
            { icon: RotateCcw, l: "Easy Returns" },
            { icon: Truck, l: "Free above ₹999" },
          ].map((b, i) => (
            <div key={i} className="bg-cream rounded-lg p-3">
              <b.icon className="w-5 h-5 text-gold mx-auto mb-1" />
              <span className="text-xs text-navy font-bold">{b.l}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8 border-t border-navy/10 pt-6">
            <button onClick={() => setOpenDesc(!openDesc)} className="w-full flex items-center justify-between text-navy font-bold">
              Description <ChevronDown className={`w-4 h-4 transition-transform ${openDesc ? "rotate-180" : ""}`} />
            </button>
            {openDesc && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-ink leading-relaxed">{product.description}</motion.p>}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-8 border-t border-navy/10 pt-6">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-xl text-navy">Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>
            {reviews.length > 0 && (
              <span className="text-sm text-muted">Avg <span className="text-navy font-bold">{avgRating.toFixed(1)}/5</span></span>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted">Be the first to review this product.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-lg p-4 border border-navy/5" data-testid={`review-${r.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">{r.author_name || "Anonymous"}</span>
                    <div className="flex text-gold">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className="w-3.5 h-3.5" fill={r.rating >= n ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-ink leading-relaxed">{r.comment}</p>}
                  {Array.isArray(r.images) && r.images.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {r.images.slice(0, 4).map((u: string, i: number) => (
                        <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-navy/10">
                          <Image src={u} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
