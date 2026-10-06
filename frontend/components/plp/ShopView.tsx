import { jsonLd } from "@/lib/html";
import ProductCard from "@/components/ProductCard";
import PLPFilters from "@/components/plp/PLPFilters";
import AppliedFilters from "@/components/plp/AppliedFilters";
import Pagination from "@/components/Pagination";
import type { Product, Category, AgeGroup } from "@/lib/types";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { abs } from "@/lib/site";

export type ShopParams = {
  category?: string;
  age?: string;
  gender?: string;
  min?: string;
  max?: string;
  sort?: string;
  q?: string;
  featured?: string;
  page?: string;
};

const NONE = "00000000-0000-0000-0000-000000000000";

export async function loadShopTaxonomy() {
  const supabase = createPublicClient();
  const [{ data: cats }, { data: ages }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("age_groups").select("*").order("sort_order"),
  ]);
  return { categories: (cats ?? []) as Category[], ageGroups: (ages ?? []) as AgeGroup[] };
}

/**
 * Product listing shared by /shop and /category/[slug].
 * Category and age filters are applied BEFORE pagination (the old page
 * filtered by age after taking a page of 20, so pages came up short and the
 * count was wrong).
 */
export default async function ShopView({ sp: rawSp, basePath }: { sp: ShopParams; basePath: string }) {
  // "?q=a&q=b" arrives as an array — use the first value so nothing crashes.
  const sp = Object.fromEntries(
    Object.entries(rawSp ?? {}).map(([k, v]) => [k, Array.isArray(v) ? String(v[0] ?? "") : v == null ? v : String(v).slice(0, 120)]),
  ) as ShopParams;
  const supabase = createPublicClient();
  const { categories, ageGroups } = await loadShopTaxonomy();

  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const selectedCat = sp.category ? catBySlug.get(sp.category) : undefined;
  const selectedAge = sp.age ? ageGroups.find((a) => a.slug === sp.age) : undefined;

  // Restrict to product ids matching category and/or age, intersected.
  let idFilter: Set<string> | null = null;
  const intersect = (ids: string[]) => {
    const next = new Set(ids);
    idFilter = idFilter ? new Set([...idFilter].filter((x) => next.has(x))) : next;
  };
  if (selectedCat) {
    const childIds = categories.filter((c) => c.parent_id === selectedCat.id).map((c) => c.id);
    const ids = [selectedCat.id, ...childIds];
    const [{ data: byPrimary }, { data: byJunction }] = await Promise.all([
      supabase.from("products").select("id").in("status", ["active", "out_of_stock"]).in("category_id", ids),
      supabase.from("product_categories").select("product_id").in("category_id", ids),
    ]);
    intersect([...(byPrimary ?? []).map((r: any) => r.id), ...(byJunction ?? []).map((r: any) => r.product_id)]);
  }
  if (selectedAge) {
    const { data: pag } = await supabase.from("product_age_groups").select("product_id").eq("age_group_id", selectedAge.id);
    intersect((pag ?? []).map((r: any) => r.product_id));
  }

  let query = supabase
    .from("products")
    .select("id, slug, name, brand, base_price, mrp, status, is_featured, is_new_arrival, alt_text, gender, images:product_images(url,alt_text,sort_order)", { count: "exact" })
    .in("status", ["active", "out_of_stock"]);

  if (idFilter) {
    const ids = [...(idFilter as Set<string>)];
    query = query.in("id", ids.length ? ids : [NONE]);
  }
  if (sp.gender && ["boys", "girls", "unisex"].includes(sp.gender)) query = query.eq("gender", sp.gender);
  if (sp.min && !Number.isNaN(Number(sp.min))) query = query.gte("base_price", Number(sp.min));
  if (sp.max && !Number.isNaN(Number(sp.max))) query = query.lte("base_price", Number(sp.max));
  if (sp.featured === "1") query = query.eq("is_featured", true);
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%_\\]/g, "")}%`);

  switch (sp.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const perPage = 20;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data, count } = await query;
  const products = ((data ?? []) as any[]).map((p) => ({
    ...p,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as Product[];
  const total = count ?? products.length;

  const parent = selectedCat?.parent_id ? categories.find((c) => c.id === selectedCat.parent_id) : undefined;
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...(parent ? [{ name: parent.name, href: `/category/${parent.slug}` }] : []),
    ...(selectedCat ? [{ name: selectedCat.name, href: `/category/${selectedCat.slug}` }] : []),
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.href) })),
  };

  // Pagination keeps every filter except the category, which is in basePath.
  const { category: _omit, ...pageParams } = sp;
  const paginationParams = (selectedCat ? pageParams : sp) as Record<string, string | undefined>;

  return (
    <div className="container py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbLd) }} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted mb-4 flex items-center gap-1.5 flex-wrap">
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === crumbs.length - 1 && selectedCat ? (
              <span className="text-navy" aria-current="page">{c.name}</span>
            ) : (
              <Link href={c.href} className="hover:text-navy">{c.name}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">
            {selectedCat ? selectedCat.meta_title || selectedCat.name : sp.q ? `Search: “${sp.q}”` : "Shop All"}
          </h1>
          {selectedCat?.meta_description && <p className="mt-2 text-ink">{selectedCat.meta_description}</p>}
          <p className="mt-2 text-muted text-sm">{total} product{total === 1 ? "" : "s"} found</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <PLPFilters categories={categories} ageGroups={ageGroups} current={sp} />

        <div>
          <AppliedFilters current={sp} categories={categories} ageGroups={ageGroups} />

          {products.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-navy/5">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-muted mb-3" />
              <p className="font-display text-xl text-navy">No matches found</p>
              <p className="text-sm text-muted mt-2">Try adjusting your filters, or explore our full catalogue.</p>
              <Link href={selectedCat ? `/category/${selectedCat.slug}` : "/shop"} className="inline-block mt-6 bg-navy text-white rounded px-6 py-3 text-sm font-bold">Reset filters</Link>
            </div>
          ) : (
            <>
              <div className="stagger-load grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <Pagination current={page} total={total} perPage={perPage} basePath={basePath} searchParams={paginationParams} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
