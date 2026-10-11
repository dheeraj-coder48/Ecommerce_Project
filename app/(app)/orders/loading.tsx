import { OrderCardSkeleton } from "@/components/app/OrderCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-9 sm:px-8 lg:px-12 lg:py-12">
      <div className="mb-9 border-b border-[#dedbd3] pb-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-5 w-52" />
      </div>

      <OrderCardSkeleton count={4} />
    </div>
  );
}
