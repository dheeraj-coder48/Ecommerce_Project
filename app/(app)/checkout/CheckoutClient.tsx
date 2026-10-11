"use client";

import { AlertTriangle, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CheckoutButton } from "@/components/app/CheckoutButton";
import { Button } from "@/components/ui/button";
import { useCartStock } from "@/lib/hooks/useCartStock";
import {
  useCartItems,
  useTotalItems,
  useTotalPrice,
} from "@/lib/store/cart-store-provider";
import { formatColorName, formatPrice } from "@/lib/utils";

export function CheckoutClient() {
  const items = useCartItems();
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { stockMap, isLoading, hasStockIssues } = useCartStock(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-700 stroke-1" />
          <h1 className="mt-6 text-xl font-light uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Your Bag is Empty
          </h1>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Please add pieces to your shopping bag before proceeding to
            checkout.
          </p>
          <Button
            asChild
            className="mt-8 rounded-none text-xs uppercase tracking-widest font-semibold h-11 px-8"
          >
            <Link href="/">Explore Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12 lg:py-14">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-3.5 w-3.5" />
          Back to Store
        </Link>
        <p className="mt-8 text-[9px] font-medium uppercase tracking-[0.28em] text-zinc-500">Your selection</p>
        <h1 className="mt-2 font-serif text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
          Shopping bag
        </h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.72fr)] lg:gap-16">
        {/* Cart Items */}
        <div>
          <div>
            <div className="flex items-center justify-between border-y border-[#d7d2c8] py-4 dark:border-zinc-800">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                Selected pieces
              </h2>
              <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{totalItems} items</span>
            </div>

            {/* Stock Issues Warning */}
            {hasStockIssues && !isLoading && (
              <div className="mx-6 mt-4 flex items-center gap-2 border border-destructive bg-destructive/10 px-4 py-3 text-xs text-destructive dark:bg-destructive/20 dark:text-destructive-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive-foreground" />
                <span>
                  Some garments have limited inventory. Please adjust quantities
                  before proceeding.
                </span>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                <span className="ml-2 text-xs uppercase tracking-wider text-zinc-500">
                  Verifying garment stock...
                </span>
              </div>
            )}

            {/* Items List */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {items.map((item) => {
                const stockInfo = stockMap.get(item.productId);
                const hasIssue =
                  stockInfo?.isOutOfStock || stockInfo?.exceedsStock;

                return (
                  <div
                    key={item.productId}
                    className={`flex gap-4 border-b border-[#e1ddd5] py-5 sm:gap-6 sm:py-6 dark:border-zinc-800 ${
                      hasIssue ? "bg-red-50/50 dark:bg-red-950/20" : ""
                    }`}
                  >
                    {/* Fashion 3:4 thumbnail */}
                    <div className="relative h-28 w-[5.25rem] shrink-0 overflow-hidden bg-[#e9e5dc] sm:h-36 sm:w-28 dark:bg-zinc-900">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="72px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] uppercase text-zinc-400">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="text-xs uppercase tracking-wider font-medium text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-foreground/70">
                          Qty: {item.quantity}
                        </p>
                        {(item.color || item.size) && (
                          <p className="mt-1 text-xs text-foreground/70">
                            {[
                              item.color &&
                                `Color: ${formatColorName(item.color)}`,
                              item.size && `Size: ${item.size}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        {stockInfo?.isOutOfStock && (
                          <p className="mt-1 text-xs font-medium text-destructive-foreground">
                            Sold out
                          </p>
                        )}
                        {stockInfo?.exceedsStock && !stockInfo.isOutOfStock && (
                          <p className="mt-1 text-xs font-medium text-destructive-foreground">
                            Only {stockInfo.currentStock} remaining
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-zinc-500">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Total & Checkout */}
        <div>
          <div className="sticky top-28 border border-[#292823] bg-[#292823] p-6 text-[#f5f1e9] sm:p-8">
            <p className="text-[9px] uppercase tracking-[0.24em] text-white/50">Secure checkout</p>
            <h2 className="mt-3 font-serif text-3xl font-light text-white">
              Order summary
            </h2>

            <div className="mt-6 space-y-3.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/60 uppercase tracking-wider">
                  Subtotal
                </span>
                <span className="font-medium text-white">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <div className="border-t border-white/20 pt-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="uppercase tracking-wider text-white/70">
                    Grand Total
                  </span>
                  <span className="text-base text-white">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CheckoutButton disabled={hasStockIssues || isLoading} />
            </div>

            <p className="mt-4 text-center text-[11px] text-white/60">
              Secure checkout powered by Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

