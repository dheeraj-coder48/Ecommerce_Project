import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, CreditCard, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getOrderStatus } from "@/lib/constants/orderStatus";
import { ORDER_BY_ID_QUERY } from "@/lib/sanity/queries/orders";
import { formatColorName, formatDate, formatPrice } from "@/lib/utils";
import { client } from "@/sanity/lib/client";

export const metadata = {
  title: "Order Details",
  description: "View your fashion order details",
};

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  const order = await client.fetch(
    ORDER_BY_ID_QUERY,
    { id },
    { cache: "no-store", useCdn: false },
  );

  // Verify order exists and belongs to current user
  if (!order || order.clerkUserId !== userId) {
    notFound();
  }

  const status = getOrderStatus(
    order.fulfillmentStatus ??
      (order.status === "paid" ? "processing" : order.status),
  );
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto max-w-5xl px-4 py-9 sm:px-8 lg:px-12 lg:py-12">
      {/* Header */}
      <div className="mb-9 border-b border-[#dedbd3] pb-6">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-normal tracking-wide text-zinc-900 dark:text-zinc-100">
              Order {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Placed on {formatDate(order.createdAt, "datetime")}
            </p>
          </div>
          <Badge className={`${status.color} flex items-center gap-1.5`}>
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Order Items */}
        <div className="lg:col-span-3">
          <div className="border border-[#dedbd3] bg-[#faf9f6] dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Items ({order.items?.length ?? 0})
              </h2>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items?.map((item) => (
                <div key={item._key} className="flex gap-4 px-6 py-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                    {item.product?.image?.asset?.url ? (
                      <Image
                        src={item.product.image.asset.url}
                        alt={item.product.name ?? "Product"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.product?.slug}`}
                        className="font-medium text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                      >
                        {item.product?.name ?? "Unknown Product"}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Qty: {item.quantity}
                      </p>
                      {(item.color || item.size) && (
                        <p className="mt-1 text-sm text-zinc-600">
                          {[
                            item.color &&
                              `Color: ${formatColorName(item.color)}`,
                            item.size && `Size: ${item.size}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {formatPrice(
                        (item.priceAtPurchase ?? 0) * (item.quantity ?? 1),
                      )}
                    </p>
                    {(item.quantity ?? 1) > 1 && (
                      <p className="text-sm text-zinc-500">
                        {formatPrice(item.priceAtPurchase)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Order Summary
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Subtotal
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(order.total)}
                </span>
              </div>
              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-zinc-100">
                    Total
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="border border-[#dedbd3] bg-[#faf9f6] p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-zinc-400" />
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Shipping Address
                </h2>
              </div>
              <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                {order.address.name && <p>{order.address.name}</p>}
                {order.address.line1 && <p>{order.address.line1}</p>}
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>
                  {[order.address.city, order.address.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.address.country && <p>{order.address.country}</p>}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="border border-[#dedbd3] bg-[#faf9f6] p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Order Status
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-light tracking-wide">
                  Fulfillment
                </span>
                <span className="text-sm font-medium capitalize text-green-600">
                  {status.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-light tracking-wide">
                  Payment
                </span>
                <span className="text-sm font-medium capitalize text-green-600">
                  {order.paymentStatus ?? "paid"}
                </span>
              </div>
              {order.email && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-light tracking-wide">Email</p>
                  <p className="min-w-0 truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {order.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
