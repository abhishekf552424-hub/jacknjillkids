import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
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
import AgeShelf from "@/components/home/AgeShelf";
import Occasions from "@/components/home/Occasions";
import GiftCorner from "@/components/home/GiftCorner";
import ShopTheLook, { type LookProduct } from "@/components/home/ShopTheLook";
import VisitStore from "@/components/home/VisitStore";
import HomeFaq from "@/components/home/HomeFaq";
import JoinClub from "@/components/home/JoinClub";
import SignOff from "@/components/home/SignOff";
import type { Tone } from "@/components/home/Section";
import { normaliseSocial } from "@/lib/social";
import type { HomepageSection, Product, Category, TrustBadge, AgeGroup } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "Jack & Jill Kolhapur — Kids' Clothing, Footwear, Toys & Baby Essentials Since 2003" },
  description:
    "Kolhapur's kids store since 2003: clothing, footwear, baby essentials, school bags, toys and gift hampers for ages 0–14. Free delivery above ₹999, easy 7-day exchange, COD available.",
  alternates: { canonical: abs("/") },
};

export const revalidate = 60;

const CARD_COLUMNS = "id, slug, name, brand, base_price, mrp, status, is_featured, is_new_arrival, alt_text, images:product_images(url,alt_text,sort_order)";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sortImages = (p: any) => ({ ...p, images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order) });

/** Products for a shelf: picked by hand, most loved, newest, or best sellers. */
async function loadProducts(config: any, limit = 8): Promise<Product[]> {
  const supabase = createPublicClient();
  const filter = config?.filter ?? "featured";
  const n = Math.min(Math.max(Number(limit) || 8, 1), 24);

  if (filter === "manual") {
    const ids: string[] = (config?.product_ids ?? []).filter((x: unknown) => typeof x === "string" && UUID.test(x)).slice(0, 24);
    if (!ids.length) return [];
    const { data } = await supabase.from("products").select(CARD_COLUMNS).in("id", ids).eq("status", "active");
    const order = new Map(ids.map((id, i) => [id, i]));
    return ((data ?? []) as any[]).map(sortImages).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, n) as Product[];
  }

  if (filter === "best_sellers") {
    // Real best sellers: pieces sold in paid / COD orders over the last 90 days.
    const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const { data: sold } = await createAdminClient()
      .from("order_items")
      .select("quantity, v:product_variants!inner(product_id), o:orders!inner(created_at, status, payment_status)")
      .gte("o.created_at", since)
      .in("o.payment_status", ["paid", "cod"])
      .neq("o.status", "cancelled")
      .limit(5000);
    const qty = new Map<string, number>();
    for (const r of (sold ?? []) as any[]) {
      const pid = Array.isArray(r.v) ? r.v[0]?.product_id : r.v?.product_id;
      if (pid) qty.set(pid, (qty.get(pid) ?? 0) + Number(r.quantity || 0));
    }
    const top = [...qty.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, n * 2);
    if (top.length) {
      const { data } = await supabase.from("products").select(CARD_COLUMNS).in("id", top).eq("status", "active");
      const rank = new Map(top.map((id, i) => [id, i]));
      const ranked = ((data ?? []) as any[]).map(sortImages).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)).slice(0, n);
      if (ranked.length) return ranked as Product[];
    }
    // No sales yet: fall back to the shop's featured picks.
  }

  let q = supabase.from("products").select(CARD_COLUMNS).eq("status", "active");
  if (filter === "new_arrivals") q = q.eq("is_new_arrival", true).order("created_at", { ascending: false });
  else q = q.eq("is_featured", true).order("created_at", { ascending: false });
  const { data } = await q.limit(n);
  return ((data ?? []) as any[]).map(sortImages) as Product[];
}

async function loadLook(ids: unknown): Promise<LookProduct[]> {
  const list = (Array.isArray(ids) ? ids : []).filter((x): x is string => typeof x === "string" && UUID.test(x)).slice(0, 4);
  if (list.length < 2) return [];
  const { data } = await createPublicClient()
    .from("products")
    .select("id, slug, name, base_price, mrp, images:product_images(url, sort_order), variants:product_variants(id, size, color, stock_qty, price_override)")
    .in("id", list)
    .eq("status", "active");
  const order = new Map(list.map((id, i) => [id, i]));
  return ((data ?? []) as any[])
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      base_price: Number(p.base_price),
      mrp: Number(p.mrp),
      image: [...(p.images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
      variants: p.variants ?? [],
    }))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

// The top of the page is visible on load, so it is not faded in on scroll.
const NO_REVEAL = new Set(["hero", "marquee"]);

// Sections that sit outside the cream/white rhythm.
const OWN_BACKGROUND = new Set(["hero", "marquee", "promo_strip", "sign_off", "trust_badges"]);

export default async function HomePage() {
  const supabase = createPublicClient();
  const [{ data: sections }, { data: cats }, { data: badges }, { data: ages }, { data: faqs }, { data: contactRow }, { data: socialRow }, { data: brandRow }] = await Promise.all([
    supabase.from("homepage_sections").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("categories").select("*").eq("is_active", true).eq("is_featured_in_menu", true).order("sort_order"),
    supabase.from("trust_badges").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("age_groups").select("*").order("sort_order"),
    supabase.from("faqs").select("id, question, answer").eq("is_active", true).order("sort_order").limit(12),
    supabase.from("settings").select("value").eq("key", "contact_info").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "social").maybeSingle(),
    supabase.from("settings").select("value").eq("key", "brand").maybeSingle(),
  ]);
  const social = normaliseSocial(socialRow?.value, brandRow?.value);

  const list = (sections ?? []) as HomepageSection[];
  const categories = (cats ?? []) as Category[];
  const trust = (badges ?? []) as TrustBadge[];
  const contact = ((contactRow?.value as any) ?? {}) as { address?: string; hours?: string; phone?: string };

  const faqList = ((faqs ?? []) as any[]);
  const ageList = (ages ?? []) as AgeGroup[];

  // Load each section's products first, so we know which sections will actually show.
  const data = await Promise.all(
    list.map(async (s) => {
      const c = (s.config ?? {}) as any;
      if (s.section_type === "product_shelf") return { products: await loadProducts(c, c.limit ?? 8) };
      if (s.section_type === "shop_the_look") return { look: await loadLook(c.product_ids) };
      return {};
    }),
  );
  const visible = (s: HomepageSection, d: any) => {
    const c = (s.config ?? {}) as any;
    switch (s.section_type) {
      case "product_shelf": return (d.products ?? []).length > 0;
      case "shop_the_look": return (d.look ?? []).filter((p: LookProduct) => p.variants.some((v) => v.stock_qty > 0)).length >= 2;
      case "faq": return faqList.length > 0;
      case "age_groups": return ageList.length > 0;
      case "occasions": return (c.cards ?? []).some((x: any) => x?.title);
      case "categories": return categories.length > 0;
      case "instagram_reels": return (c.videos ?? []).some((v: any) => v?.url);
      case "parents_reviews": return (c.videos ?? []).some((v: any) => v?.url || v?.caption) || Boolean(social.google_rating && social.google_reviews_url);
      default: return true;
    }
  };

  // Alternate cream / white between the sections that show, so the page breathes.
  let flip = 0;
  const tones: Tone[] = list.map((s, i) => {
    if (OWN_BACKGROUND.has(s.section_type) || !visible(s, data[i])) return "cream";
    return flip++ % 2 === 0 ? "cream" : "white";
  });

  const renderSection = (s: HomepageSection, tone: Tone, d: any) => {
    const c = (s.config ?? {}) as any;
    switch (s.section_type) {
      case "hero":
        return <HeroCarousel slides={c.slides ?? []} title={s.title} subtitle={s.subtitle} />;
      case "age_groups":
        return <AgeShelf ages={ageList} title={s.title} subtitle={s.subtitle} config={c} tone={tone} />;
      case "categories":
        return <CategoryShelf categories={categories} shape={c.shape ?? "circle"} title={s.title} subtitle={s.subtitle} tone={tone} />;
      case "product_shelf": {
        const products: Product[] = d.products ?? [];
        const isNew = c.filter === "new_arrivals";
        return (
          <ProductShelf
            title={s.title || (isNew ? "New arrivals" : "Most loved")}
            subtitle={s.subtitle}
            eyebrow={c.eyebrow || (isNew ? "Just in" : c.filter === "best_sellers" ? "Bestsellers" : "Curated")}
            products={products}
            viewAllHref={isNew ? "/shop?sort=newest" : "/shop?featured=1"}
            tone={tone}
          />
        );
      }
      case "occasions":
        return <Occasions title={s.title} subtitle={s.subtitle} config={c} tone={tone} />;
      case "gift_corner":
        return <GiftCorner title={s.title} subtitle={s.subtitle} config={c} tone={tone} />;
      case "shop_the_look":
        return <ShopTheLook title={s.title} subtitle={s.subtitle} config={c} products={d.look ?? []} tone={tone} />;
      case "brand_story":
        return <BrandStory title={s.title} subtitle={s.subtitle} image={c.image} video={c.video} embed_url={c.embed_url} body={c.body} tone={tone} config={c} />;
      case "instagram_reels":
        return <InstagramReels title={s.title} subtitle={s.subtitle} videos={c.videos ?? []} tone={tone} handle={c.handle} profileUrl={c.profile_url} instagram={social.instagram} />;
      case "parents_reviews":
        return <ParentsReviews title={s.title} subtitle={s.subtitle} videos={c.videos ?? []} tone={tone} social={social} />;
      case "visit_store":
        return <VisitStore title={s.title} subtitle={s.subtitle} config={c} contact={contact} tone={tone} social={social} />;
      case "faq":
        return <HomeFaq title={s.title} subtitle={s.subtitle} config={c} faqs={faqList.slice(0, Math.min(Number(c.limit) || 6, 12))} tone={tone} />;
      case "join_club":
        return <JoinClub title={s.title} subtitle={s.subtitle} config={{ eyebrow: c.eyebrow, button_text: c.button_text }} tone={tone} />;
      case "sign_off":
        return <SignOff title={s.title} subtitle={s.subtitle} social={social} />;
      case "trust_badges":
        return <TrustStrip badges={trust} />;
      case "marquee":
        return <MarqueeStrip title={s.title} items={c.items ?? []} speedSec={c.speed_sec} />;
      case "promo_strip":
        return <PromoStrip title={s.title} subtitle={s.subtitle} cards={c.cards ?? []} />;
      default:
        return null;
    }
  };

  const rendered = list.map((s, i) => (visible(s, data[i]) ? renderSection(s, tones[i], data[i]) : null));
  return (
    <>
      {rendered.map((node, i) =>
        !node ? null : NO_REVEAL.has(list[i].section_type) ? (
          // The first screen shows straight away (fast first paint, better Google score).
          <div key={list[i].id}>{node}</div>
        ) : (
          <Reveal key={list[i].id}>{node}</Reveal>
        ),
      )}
    </>
  );
}
