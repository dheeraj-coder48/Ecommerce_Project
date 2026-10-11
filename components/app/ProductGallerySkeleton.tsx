import { Skeleton } from "@/components/ui/skeleton";

export function ProductGallerySkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2 lg:grid lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-4">
      {/* Main Image */}
      <Skeleton className="mx-auto aspect-[4/5] max-h-[min(62svh,38rem)] w-[min(100%,49.6svh)] sm:max-h-[72svh] sm:w-[min(100%,57.6svh)] lg:order-2 lg:max-h-[76vh] lg:w-full" />

      {/* Thumbnail Gallery */}
      <div className="order-2 flex min-w-0 gap-2 overflow-x-auto px-5 pb-1 sm:px-0 lg:order-1 lg:max-h-[76vh] lg:flex-col lg:overflow-y-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-14 shrink-0 rounded-none lg:w-full" />
        ))}
      </div>
    </div>
  );
}
