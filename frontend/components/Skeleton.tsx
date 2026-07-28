import { cn } from "@/lib/utils";

/**
 * Reusable skeleton loader. Uses one consistent animation across the site.
 * Never render a blank flash — always render <Skeleton /> or a variant while data loads.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-navy/5", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Product-card-shaped skeleton — used by product grids and shelves. */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded p-3 shadow-soft" data-testid="skeleton-product-card">
      <Skeleton className="aspect-[4/5] w-full rounded-sm" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-3 h-5 w-1/2" />
    </div>
  );
}

/** Grid of product-card skeletons. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" data-testid="skeleton-product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Review card skeleton — used by reviews list. */
export function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-lg p-5 shadow-soft" data-testid="skeleton-review">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-2.5 w-1/6" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-11/12" />
      <Skeleton className="mt-2 h-3 w-3/4" />
    </div>
  );
}
