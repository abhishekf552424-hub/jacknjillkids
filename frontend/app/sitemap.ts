import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [{ data: products }, { data: cats }, { data: pages }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").in("status", ["active", "out_of_stock"]),
    supabase.from("categories").select("slug").eq("is_active", true),
    supabase.from("cms_pages").select("slug, updated_at"),
  ]);

  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.6 },
  ];
  const catUrls: MetadataRoute.Sitemap = (cats ?? []).map((c: any) => ({
    url: `${SITE_URL}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p: any) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const cmsUrls: MetadataRoute.Sitemap = (pages ?? []).map((p: any) => ({
    url: `${SITE_URL}/legal/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "yearly",
    priority: 0.3,
  }));
  return [...staticUrls, ...catUrls, ...productUrls, ...cmsUrls];
}
