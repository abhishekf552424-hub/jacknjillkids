import { ProductGridSkeleton } from "@/components/Skeleton";

export default function ShopLoading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="h-3 w-40 bg-navy/5 rounded animate-pulse mb-4" />
      <div className="h-10 w-64 bg-navy/5 rounded animate-pulse mb-2" />
      <div className="h-3 w-32 bg-navy/5 rounded animate-pulse mb-8" />
      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <div className="hidden lg:block space-y-3">
          <div className="h-6 w-24 bg-navy/5 rounded animate-pulse" />
          <div className="h-3 w-full bg-navy/5 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-navy/5 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-navy/5 rounded animate-pulse" />
        </div>
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
