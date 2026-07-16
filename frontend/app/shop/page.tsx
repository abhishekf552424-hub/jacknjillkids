import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import PLPFilters from "@/components/plp/PLPFilters";
import type { Product, Category, AgeGroup } from "@/lib/types";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

export const revalidate = 30;

type SP = {
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

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const bits: string[] = [];
  if (sp.category) bits.push(sp.category.replace(/-/g, " "));
  if (sp.age) bits.push(`(${sp.age.replace(/-/g, " ")})`);
  const t = bits.length ? `Shop ${bits.join(" ")} — Jack & Jill` : "Shop All — Jack & Jill";
  return {
    title: t,
    description: "Premium kids fashion, footwear, baby essentials, toys and gift hampers. Free shipping above ₹999.",
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: cats }, { data: ages }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("age_groups").select("*").order("sort_order"),
  ]);

  const categories = (cats ?? []) as Category[];
  const ageGroups = (ages ?? []) as AgeGroup[];

  const catBySlug = new Map(categories.map((c) => [c.slug, c]));
  const selectedCat = sp.category ? catBySlug.get(sp.category) : undefined;

  // Build query
  let query = supabase
    .from("products")
    .select("*, images:product_images(url,alt_text,sort_order)", { count: "exact" })
    .eq("status", "active");

  if (selectedCat) {
    // Include children of selected category
    const childIds = categories.filter((c) => c.parent_id === selectedCat.id).map((c) => c.id);
    const ids = [selectedCat.id, ...childIds];
    query = query.in("category_id", ids);
  }
  if (sp.gender && ["boys", "girls", "unisex"].includes(sp.gender)) {
    query = query.eq("gender", sp.gender);
  }
  if (sp.min) query = query.gte("base_price", Number(sp.min));
  if (sp.max) query = query.lte("base_price", Number(sp.max));
  if (sp.featured === "1") query = query.eq("is_featured", true);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

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
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  query = query.range((page - 1) * perPage, page * perPage - 1);

  const { data, count } = await query;
  let products = ((data ?? []) as any[]).map((p) => ({
    ...p,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) as Product[];

  // If age filter applied, further intersect via junction table
  if (sp.age) {
    const ag = ageGroups.find((a) => a.slug === sp.age);
    if (ag && products.length) {
      const { data: pag } = await supabase
        .from("product_age_groups")
        .select("product_id")
        .eq("age_group_id", ag.id)
        .in("product_id", products.map((p) => p.id));
      const set = new Set((pag ?? []).map((r: any) => r.product_id));
      products = products.filter((p) => set.has(p.id));
    }
  }

  const total = count ?? products.length;

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-muted mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-navy">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-navy">Shop</Link>
        {selectedCat && (
          <>
            <span>/</span>
            <span className="text-navy">{selectedCat.name}</span>
          </>
        )}
      </nav>

      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-navy tracking-tight">
            {selectedCat ? selectedCat.name : sp.q ? `Search: “${sp.q}”` : "Shop All"}
          </h1>
          <p className="mt-2 text-muted text-sm">{total} product{total === 1 ? "" : "s"} found</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <PLPFilters categories={categories} ageGroups={ageGroups} current={sp} />

        <div>
          {products.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-navy/5">
              <SlidersHorizontal className="w-8 h-8 mx-auto text-muted mb-3" />
              <p className="font-display text-xl text-navy">No matches found</p>
              <p className="text-sm text-muted mt-2">Try adjusting your filters, or explore our full catalogue.</p>
              <Link href="/shop" className="inline-block mt-6 bg-navy text-white rounded px-6 py-3 text-sm font-medium">Reset filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
