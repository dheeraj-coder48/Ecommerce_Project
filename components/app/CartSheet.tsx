"use client";

import { AlertTriangle, Loader2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStock } from "@/lib/hooks/useCartStock";
import {
  useCartActions,
  useCartIsOpen,
  useCartItems,
  useTotalItems,
} from "@/lib/store/cart-store-provider";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";

export function CartSheet() {
  const items = useCartItems();
  const isOpen = useCartIsOpen();
  const totalItems = useTotalItems();
  const { closeCart } = useCartActions();
  const { stockMap, isLoading, hasStockIssues } = useCartStock(items);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex min-h-0 w-full flex-col gap-0 overflow-hidden rounded-none border-l border-[#d7d2c8] bg-[#f7f5ef] dark:border-zinc-800 dark:bg-zinc-950 sm:max-w-xl">
        <SheetHeader className="sticky top-0 z-20 shrink-0 border-b border-white/15 bg-[#292823] p-6 pr-16 text-white sm:p-8 sm:pr-20">
          <p className="text-[9px] uppercase tracking-[0.26em] text-white/55">Your shopping bag</p>
          <SheetTitle className="mt-2 flex items-center gap-3 font-serif text-3xl font-light tracking-tight text-white">
            <ShoppingBag className="h-4 w-4" />
            Shopping bag <span className="font-sans text-[10px] font-normal uppercase tracking-[0.18em] text-white/60">{totalItems} items</span>
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-[#a7a095] stroke-[1]" />
            <h3 className="mt-5 font-serif text-2xl font-light text-foreground">
              Your Bag is Empty
            </h3>
            <p className="mt-2 max-w-xs text-xs leading-5 text-foreground/70">
              Explore our current season apparel to select your pieces.
            </p>
          </div>
        ) : (
          <>
            {/* Stock Issues Banner */}
            {hasStockIssues && !isLoading && (
              <div className="flex items-center gap-2 border-b border-destructive bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/20 dark:text-destructive-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive-foreground" />
                <span>
                  Certain items have limited inventory. Please review before
                  proceeding.
                </span>
              </div>
            )}

            {/* Cart Items */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
              <div className="space-y-1 py-4 divide-y divide-zinc-100 dark:divide-zinc-900">
                {items.map((item) => (
                  <CartItem
                    key={item.variantKey}
                    item={item}
                    stockInfo={stockMap.get(item.productId)}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <CartSummary hasStockIssues={hasStockIssues} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

