import { Skeleton, ProductGridSkeleton } from "@/components/Skeleton";

export default function ProductLoading() {
  return (
    <div className="container py-8 md:py-12">
      <Skeleton className="h-3 w-64 mb-4" />
      <div className="grid md:grid-cols-2 gap-10">
        <Skeleton className="aspect-[4/5] w-full rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-12 w-full mt-6" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="mt-20">
        <Skeleton className="h-8 w-52 mb-6" />
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
