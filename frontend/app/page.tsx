import { createClient } from "@/lib/supabase/server";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryShelf from "@/components/CategoryShelf";
import ProductShelf from "@/components/ProductShelf";
import BrandStory from "@/components/BrandStory";
import InstagramReels from "@/components/InstagramReels";
import ParentsReviews from "@/components/ParentsReviews";
import TrustStrip from "@/components/TrustStrip";
import type { HomepageSection, Product, Category, TrustBadge } from "@/lib/types";

export const revalidate = 60;

async function loadProducts(filter: string, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  let q = supabase
    .from("products")
    .select("*, images:product_images(url,alt_text,sort_order)")
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
  const supabase = await createClient();
  const [{ data: sections }, { data: cats }, { data: badges }] = await Promise.all([
    supabase.from("homepage_sections").select("*").eq("is_active", true).order("sort_order"),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured_in_menu", true)
      .is("parent_id", null)
      .order("sort_order"),
    supabase.from("trust_badges").select("*").eq("is_active", true).order("sort_order"),
  ]);

  const list = (sections ?? []) as HomepageSection[];
  const categories = (cats ?? []) as Category[];
  const trust = (badges ?? []) as TrustBadge[];

  const renderSection = async (s: HomepageSection) => {
    switch (s.section_type) {
      case "hero":
        return <HeroCarousel key={s.id} slides={s.config?.slides ?? []} title={s.title} subtitle={s.subtitle} />;
      case "categories":
        return <CategoryShelf key={s.id} categories={categories} shape={s.config?.shape ?? "circle"} title={s.title} subtitle={s.subtitle} />;
      case "product_shelf": {
        const products = await loadProducts(s.config?.filter ?? "featured", s.config?.limit ?? 8);
        const tint = s.config?.filter === "new_arrivals" ? "sky" : "cream";
        return (
          <ProductShelf
            key={s.id}
            title={s.title || (s.config?.filter === "new_arrivals" ? "New Arrivals" : "Most Loved")}
            subtitle={s.subtitle}
            products={products}
            viewAllHref={s.config?.filter === "new_arrivals" ? "/shop?sort=newest" : "/shop?featured=1"}
            tint={tint as any}
          />
        );
      }
      case "brand_story":
        return <BrandStory key={s.id} title={s.title} subtitle={s.subtitle} image={s.config?.image} />;
      case "instagram_reels":
        return <InstagramReels key={s.id} title={s.title} subtitle={s.subtitle} urls={s.config?.urls ?? []} />;
      case "parents_reviews":
        return <ParentsReviews key={s.id} title={s.title} subtitle={s.subtitle} videos={s.config?.videos ?? []} />;
      case "trust_badges":
        return <TrustStrip key={s.id} badges={trust} />;
      default:
        return null;
    }
  };

  const rendered = await Promise.all(list.map(renderSection));
  return <>{rendered}</>;
}
