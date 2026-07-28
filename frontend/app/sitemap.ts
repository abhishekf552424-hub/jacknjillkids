import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://alankarfashions.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: cats }, { data: pages }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("status", "active"),
    supabase.from("categories").select("slug").eq("is_active", true),
    supabase.from("cms_pages").select("slug, updated_at"),
  ]);

  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,          lastModified: now, priority: 1.0 },
    { url: `${SITE_URL}/shop`,      lastModified: now, priority: 0.9 },
    { url: `${SITE_URL}/about`,     lastModified: now, priority: 0.7 },
    { url: `${SITE_URL}/contact`,   lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/faq`,       lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/track`,     lastModified: now, priority: 0.5 },
  ];
  const productUrls = (products ?? []).map((p: any) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    priority: 0.8,
  }));
  const catUrls = (cats ?? []).map((c: any) => ({
    url: `${SITE_URL}/shop?category=${c.slug}`,
    lastModified: now,
    priority: 0.7,
  }));
  const cmsUrls = (pages ?? []).map((p: any) => ({
    url: `${SITE_URL}/legal/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    priority: 0.4,
  }));
  return [...staticUrls, ...productUrls, ...catUrls, ...cmsUrls];
}
