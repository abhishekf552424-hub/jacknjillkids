import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopView, { loadShopTaxonomy, type ShopParams } from "@/components/plp/ShopView";
import { abs } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<ShopParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const { categories } = await loadShopTaxonomy();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Category not found", robots: { index: false } };
  const title = cat.meta_title || `${cat.name} for kids — shop online in Kolhapur`;
  const description =
    cat.meta_description ||
    `Shop ${cat.name.toLowerCase()} for babies and kids at Jack & Jill, Kolhapur's kids store since 2003. Sizes by age, free delivery above ₹999 and easy 7-day exchange.`;
  const canonical = abs(`/category/${cat.slug}`);
  // Only the clean category page is indexed; filtered/sorted variants point to it.
  const hasFilters = Object.keys(sp).some((k) => k !== "page");
  return {
    title,
    description,
    alternates: { canonical },
    robots: hasFilters ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: canonical, type: "website", ...(cat.image_url ? { images: [cat.image_url] } : {}) },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const { categories } = await loadShopTaxonomy();
  if (!categories.some((c) => c.slug === slug)) notFound();
  return <ShopView sp={{ ...sp, category: slug }} basePath={`/category/${encodeURIComponent(slug)}`} />;
}
