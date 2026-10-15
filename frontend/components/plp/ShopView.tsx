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
import { childrenMap, descendantIds, pathTo, visibleCategories } from "@/lib/category-tree";
import { optimised } from "@/lib/img";

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
  // Only what shoppers may see: a switched-off category hides everything under it.
  return { categories: visibleCategories((cats ?? []) as Category[]), ageGroups: (ages ?? []) as AgeGroup[] };
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
    // The category itself plus every level below it (Clothing → Girls → Frocks → …).
    const ids = [selectedCat.id, ...descendantIds(categories, selectedCat.id)];
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
    .select("id, slug, name, brand, base_price, mrp, price_min, price_max, mrp_min, status, is_featured, is_new_arrival, alt_text, gender, images:product_images(url,alt_text,sort_order)", { count: "exact" })
    .in("status", ["active", "out_of_stock"]);

  if (idFilter) {
    const ids = [...(idFilter as Set<string>)];
    query = query.in("id", ids.length ? ids : [NONE]);
  }
  if (sp.gender && ["boys", "girls", "unisex"].includes(sp.gender)) query = query.eq("gender", sp.gender);
  // Price filters/sort use the lowest size price (same as the "From ₹…" on the card).
  if (sp.min && !Number.isNaN(Number(sp.min))) query = query.gte("price_min", Number(sp.min));
  if (sp.max && !Number.isNaN(Number(sp.max))) query = query.lte("price_min", Number(sp.max));
  if (sp.featured === "1") query = query.eq("is_featured", true);
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%_\\]/g, "")}%`);

  switch (sp.sort) {
    case "price_asc":
      query = query.order("price_min", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_min", { ascending: false });
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

  // Full path: Home / Shop / Clothing / Girls / Frocks
  const trail = selectedCat ? pathTo(categories, selectedCat.id) : [];
  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    ...trail.map((c) => ({ name: c.name, href: `/category/${c.slug}` })),
  ];
  // Sub-category chips: this category's children; on a last-level category, its sisters.
  const kids = childrenMap(categories);
  const subChips = selectedCat
    ? (kids.get(selectedCat.id)?.length ? kids.get(selectedCat.id)! : selectedCat.parent_id ? kids.get(selectedCat.parent_id) ?? [] : [])
    : [];
  const chipsAreSiblings = !!selectedCat && !kids.get(selectedCat.id)?.length;
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

      {subChips.length > (chipsAreSiblings ? 1 : 0) && (
        <nav aria-label={chipsAreSiblings ? "Related categories" : `Shop ${selectedCat!.name} by type`} className="-mx-4 px-4 mb-6 overflow-x-auto no-scrollbar" data-testid="subcat-chips">
          <ul className="flex gap-2.5 w-max">
            {chipsAreSiblings && trail.length > 1 && (
              <li>
                <Link href={`/category/${trail[trail.length - 2].slug}`} className="flex items-center gap-2 rounded-full border border-navy/15 bg-white pl-1.5 pr-4 py-1.5 text-sm font-semibold text-navy hover:border-navy/40 transition-colors">
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-cream text-xs">All</span>
                  All {trail[trail.length - 2].name}
                </Link>
              </li>
            )}
            {subChips.map((c) => {
              const on = c.id === selectedCat!.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`/category/${c.slug}`}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full border pl-1.5 pr-4 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${on ? "bg-navy text-white border-navy" : "bg-white text-navy border-navy/15 hover:border-navy/40"}`}
                  >
                    {c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={optimised(c.image_url, 96)} alt="" className="w-8 h-8 rounded-full object-cover bg-cream" loading="lazy" />
                    ) : (
                      <span aria-hidden="true" className={`grid place-items-center w-8 h-8 rounded-full text-xs font-bold ${on ? "bg-white/15" : "bg-cream"}`}>{c.name.trim().charAt(0).toUpperCase()}</span>
                    )}
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

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
