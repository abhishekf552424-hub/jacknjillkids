import BrandLoader from "@/components/BrandLoader";

/**
 * Global route-transition loader (Next.js convention).
 * Shown while any server component in a new route segment is streaming/loading.
 */
export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[60] bg-cream/70 backdrop-blur-sm flex items-center justify-center">
      <BrandLoader size="lg" label="Loading" />
    </div>
  );
}
