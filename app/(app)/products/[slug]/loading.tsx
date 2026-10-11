import { ProductGallerySkeleton } from "@/components/app/ProductGallerySkeleton";
import { ProductInfoSkeleton } from "@/components/app/ProductInfoSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#f6f4ef] dark:bg-zinc-900">
      <div className="mx-auto max-w-[1320px] px-0 py-0 sm:px-8 lg:px-12 lg:py-6">
        <div className="flex items-center gap-2 px-5 pt-4 lg:hidden sm:px-0">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-10">
          {/* Image Gallery */}
          <ProductGallerySkeleton />

          {/* Product Info */}
          <ProductInfoSkeleton />
        </div>
      </div>
    </div>
  );
}
