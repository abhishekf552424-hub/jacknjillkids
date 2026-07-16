import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PDPClient from "@/components/pdp/PDPClient";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 60;

async function loadProduct(slug: string) {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("products")
    .select(
      "*, images:product_images(*), variants:product_variants(*), category:categories(*)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return null;
  p.images = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  return p as Product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadProduct(slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.meta_title || p.name,
    description: p.meta_description || p.short_description || `Buy ${p.name} at Jack & Jill — premium kids fashion in India.`,
    openGraph: {
      title: p.name,
      description: p.short_description || undefined,
      images: p.images?.slice(0, 1).map((i) => i.url),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return notFound();

  const supabase = await createClient();
  const { data: related } = await supabase
    .from("products")
    .select("*, images:product_images(url,alt_text,sort_order)")
    .eq("status", "active")
    .neq("id", product.id)
    .eq("category_id", product.category_id ?? "")
    .limit(4);
  const relatedList = ((related ?? []) as any[]).map((p) => ({
    ...p,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as Product[];

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.map((i) => i.url) ?? [],
    description: product.description ?? "",
    brand: { "@type": "Brand", name: product.brand ?? "Jack & Jill" },
    sku: product.variants?.[0]?.sku ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.base_price,
      availability: product.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <div className="container py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-muted mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-navy">Home</Link><span>/</span>
          <Link href="/shop" className="hover:text-navy">Shop</Link>
          {product.category && (<><span>/</span><Link href={`/shop?category=${product.category.slug}`} className="hover:text-navy">{product.category.name}</Link></>)}
          <span>/</span><span className="text-navy line-clamp-1">{product.name}</span>
        </nav>

        <PDPClient product={product} reviews={reviews ?? []} />

        {relatedList.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-2xl md:text-3xl text-navy mb-6">You may also love</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedList.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
