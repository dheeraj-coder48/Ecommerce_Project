import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { StackedProductImages } from "@/components/app/StackedProductImages";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { ORDERS_BY_USER_QUERY } from "@/lib/sanity/queries/orders";
import { formatDate, formatOrderNumber, formatPrice } from "@/lib/utils";
import { client } from "@/sanity/lib/client";

export const metadata = {
  title: "Your Orders",
  description: "View your fashion order history",
};

export default async function OrdersPage() {
  const { userId } = await auth();

  const orders = await client.fetch(
    ORDERS_BY_USER_QUERY,
    { clerkUserId: userId ?? "" },
    { cache: "no-store", useCdn: false },
  );

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={{ label: "Start Shopping", href: "/" }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-9 sm:px-8 lg:px-12 lg:py-12">
      <div className="mb-9 border-b border-[#dedbd3] pb-6">
        <h1 className="font-serif text-3xl font-normal tracking-wide text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Your Orders
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Track and manage your orders
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const status = getOrderStatus(
            order.fulfillmentStatus ??
              (order.status === "paid" ? "processing" : order.status),
          );
          const StatusIcon = status.icon;
          const images = (order.itemImages ?? []).filter(
            (url): url is string => url !== null,
          );

          return (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block border border-[#dedbd3] bg-[#faf9f6] transition-colors hover:border-[#a8aa9e] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="flex min-w-0 gap-3 p-3 sm:gap-5 sm:p-5">
                {/* Left: Product Images Stack */}
                <StackedProductImages
                  images={images}
                  totalCount={order.itemCount ?? 0}
                  size="lg"
                />

                {/* Right: Order Details */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  {/* Top: Order Info + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Order #{formatOrderNumber(order.orderNumber)}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      className={`${status.color} shrink-0 flex max-w-[46%] items-center gap-1 whitespace-normal text-[10px] leading-tight sm:max-w-none sm:text-xs`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Bottom: Items + Total */}
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer: View Details */}
              <div className="flex min-w-0 items-center justify-between gap-3 border-t border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:px-5">
                <p className="min-w-0 truncate text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                  {order.itemNames
                    ?.slice(0, 2)
                    .map((name, index) => {
                      const variant = order.itemVariants?.[index];
                      const choice = [variant?.color, variant?.size]
                        .filter(Boolean)
                        .join(" / ");
                      return `${name ?? "Item"}${choice ? ` · ${choice}` : ""}`;
                    })
                    .join(", ")}
                  {(order.itemNames?.length ?? 0) > 2 && "..."}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 sm:text-sm">
                  View order
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
