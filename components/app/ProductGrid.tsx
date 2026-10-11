import { PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { FILTER_PRODUCTS_BY_NAME_QUERYResult } from "@/sanity.types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: FILTER_PRODUCTS_BY_NAME_QUERYResult;
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="min-h-[360px] border border-dashed border-zinc-300 bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/50">
        <EmptyState
          icon={PackageSearch}
          title="No ethnic wear found"
          description="Try adjusting your search or filters to explore more men's traditional styles."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 @md:grid-cols-3 @md:gap-x-5 @md:gap-y-8 @5xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}
