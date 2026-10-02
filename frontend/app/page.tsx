import { createPublicClient } from "@/lib/supabase/public";
import type { Metadata } from "next";
import { abs } from "@/lib/site";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryShelf from "@/components/CategoryShelf";
import ProductShelf from "@/components/ProductShelf";
import BrandStory from "@/components/BrandStory";
import InstagramReels from "@/components/InstagramReels";
import ParentsReviews from "@/components/ParentsReviews";
import TrustStrip from "@/components/TrustStrip";
import MarqueeStrip from "@/components/MarqueeStrip";
import PromoStrip from "@/components/PromoStrip";
import Reveal from "@/components/Reveal";
import AgeBubbles from "@/components/AgeBubbles";
import VisitStore from "@/components/VisitStore";
import ParentFaq from "@/components/ParentFaq";
import type { HomepageSection, Product, Category, TrustBadge, AgeGroup } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Jack & Jill Kolhapur — Kids' Clothing, Footwear, Toys & Baby Essentials Since 2003" },
  description:
    "Kolhapur's kids store since 2003: clothing, footwear, baby essentials, school bags, toys and gift hampers for ages 0–14. Free delivery above ₹999, easy 7-day exchange, COD available.",
  alternates: { canonical: abs("/") },
};

export const revalidate = 60;

async function loadProducts(filter: string, limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();
  // Select only columns needed by ProductCard (avoid select('*') for perf).
  let q = supabase
    .from("products")
    .select("id, slug, name, brand, base_price, mrp, status, is_featured, is_new_arrival, alt_text, images:product_images(url,alt_text,sort_order)")
    .eq("status", "active")
    .limit(limit);
  if (filter === "featured") q = q.eq("is_featured", true);
  else if (filter === "new_arrivals") q = q.eq("is_new_arrival", true).order("created_at", { ascending: false });
  const { data } = await q;
  return (data ?? []).map((p: any) => ({
    ...p,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as Product[];
}

export default async function HomePage() {
  const supabase = createPublicClient();
  const [{ data: sections }, { data: cats }, { data: badges }, { data: ages }, { data: faqRows }, { data: contactRow }, { data: brandRow }] = await Promise.all([
    supabase.from("homepage_sections").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured_in_menu", true)
      .is("parent_id", null)
      .order("sort_order"),
    supabase.from("trust_badges").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("age_groups").select("*").order("sort_order"),
    supabase.from("faqs").select("id, question, answer").eq("is_active", true).order("sort_order").limit(8),
    supabase.from("settings").select("value").eq("key", "contact_info").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "brand").maybeSingle(),
  ]);
  const ageGroups = (ages ?? []) as AgeGroup[];
  const faqs = (faqRows ?? []) as { id: string; question: string; answer: string }[];
  const contact = (contactRow?.value ?? {}) as { address?: string; phone?: string; hours?: string };
  const brand = (brandRow?.value ?? {}) as { whatsapp_number?: string };

  const list = (sections ?? []) as HomepageSection[];
  const categories = (cats ?? []) as Category[];
  const trust = (badges ?? []) as TrustBadge[];

  const renderSection = async (s: HomepageSection) => {
    switch (s.section_type) {
      case "hero":
        return (
          <Reveal key={s.id}>
            <HeroCarousel slides={s.config?.slides ?? []} title={s.title} subtitle={s.subtitle} />
          </Reveal>
        );
      case "categories":
        return (
          <Reveal key={s.id}>
            <CategoryShelf categories={categories} shape={s.config?.shape ?? "circle"} title={s.title} subtitle={s.subtitle} />
          </Reveal>
        );
      case "product_shelf": {
        const products = await loadProducts(s.config?.filter ?? "featured", s.config?.limit ?? 8);
        const tint = s.config?.filter === "new_arrivals" ? "sky" : "cream";
        return (
          <Reveal key={s.id}>
            <ProductShelf
              title={s.title || (s.config?.filter === "new_arrivals" ? "New Arrivals" : "Most Loved")}
              subtitle={s.subtitle}
              products={products}
              viewAllHref={s.config?.filter === "new_arrivals" ? "/shop?sort=newest" : "/shop?featured=1"}
              tint={tint as any}
            />
          </Reveal>
        );
      }
      case "brand_story":
        return (
          <Reveal key={s.id}>
            <BrandStory title={s.title} subtitle={s.subtitle} image={s.config?.image} video={s.config?.video} embed_url={s.config?.embed_url} />
          </Reveal>
        );
      case "instagram_reels":
        return (
          <Reveal key={s.id}>
            <InstagramReels title={s.title} subtitle={s.subtitle} videos={s.config?.videos ?? []} />
          </Reveal>
        );
      case "parents_reviews":
        return (
          <Reveal key={s.id}>
            <ParentsReviews title={s.title} subtitle={s.subtitle} videos={s.config?.videos ?? []} />
          </Reveal>
        );
      case "trust_badges":
        return (
          <Reveal key={s.id}>
            <TrustStrip badges={trust} />
          </Reveal>
        );
      case "marquee":
        return (
          <Reveal key={s.id}>
            <MarqueeStrip title={s.title} items={s.config?.items ?? []} speedSec={s.config?.speed_sec} />
          </Reveal>
        );
      case "promo_strip":
        return (
          <Reveal key={s.id}>
            <PromoStrip title={s.title} subtitle={s.subtitle} cards={s.config?.cards ?? []} />
          </Reveal>
        );
      case "age_groups":
        return (
          <Reveal key={s.id}>
            <AgeBubbles ageGroups={ageGroups} title={s.title} subtitle={s.subtitle} />
          </Reveal>
        );
      case "visit_store":
        return (
          <Reveal key={s.id}>
            <VisitStore title={s.title} subtitle={s.subtitle} image={s.config?.image} contact={contact} whatsapp={brand.whatsapp_number} />
          </Reveal>
        );
      case "faq":
        return (
          <Reveal key={s.id}>
            <ParentFaq faqs={faqs.slice(0, s.config?.limit ?? 4)} title={s.title} subtitle={s.subtitle} />
          </Reveal>
        );
      default:
        return null;
    }
  };

  const rendered = await Promise.all(list.map(renderSection));
  return <>{rendered}</>;
}
