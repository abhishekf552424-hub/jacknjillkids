import { permanentRedirect } from "next/navigation";
import ShopView, { type ShopParams } from "@/components/plp/ShopView";
import { plpHref } from "@/lib/plp-url";
import { abs } from "@/lib/site";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const sp = await searchParams;
  const isSearch = Boolean(sp.q);
  const title = isSearch ? `Search: ${sp.q}` : "Shop kids' clothing, footwear, toys & baby essentials";
  return {
    title,
    description:
      "Shop kids' clothing, footwear, baby essentials, school bags, toys and gift hampers from Jack & Jill, Kolhapur's kids store since 2003. Free delivery above ₹999.",
    // Filtered/sorted/paged variants all point at the one listing URL.
    alternates: { canonical: abs("/shop") },
    // Search result pages are thin duplicates — keep them out of the index.
    robots: isSearch ? { index: false, follow: true } : undefined,
    openGraph: { title, url: abs("/shop"), type: "website" },
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const sp = await searchParams;
  // Old category URLs (/shop?category=x) move to /category/x, keeping other filters.
  if (sp.category) permanentRedirect(plpHref(sp as Record<string, string | undefined>));
  return <ShopView sp={sp} basePath="/shop" />;
}
