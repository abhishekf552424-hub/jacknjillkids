import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let results: Product[] = [];
  if (query) {
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, brand, base_price, mrp, status, is_new_arrival, alt_text, images:product_images(url,alt_text,sort_order)")
      .eq("status", "active")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(24);
    results = ((data ?? []) as any[]).map((p) => ({
      ...p,
      images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    })) as Product[];
  }

  return (
    <div className="container py-12 md:py-16">
      <p className="text-xs uppercase tracking-widest text-gold font-bold">Search</p>
      <h1 className="font-display text-3xl md:text-4xl text-navy tracking-tight mt-1">
        {query ? <>Results for “{query}”</> : "What are you looking for?"}
      </h1>
      <p className="mt-2 text-muted">{query ? `${results.length} product${results.length === 1 ? "" : "s"} found` : "Try searching for frocks, toys, school bags, feeding bottles..."}</p>

      {results.length === 0 && query && (
        <div className="mt-10 bg-white rounded-lg p-12 text-center border border-navy/5">
          <p className="font-display text-xl text-navy">No matches</p>
          <p className="text-sm text-muted mt-2">Try a different word, or explore our full catalogue.</p>
          <a href="/shop" className="inline-block mt-6 bg-navy text-white rounded-md px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity">Browse shop</a>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
