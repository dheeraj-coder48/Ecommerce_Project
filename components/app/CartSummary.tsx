"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  useCartActions,
  useTotalItems,
  useTotalPrice,
} from "@/lib/store/cart-store-provider";
import { formatPrice } from "@/lib/utils";

interface CartSummaryProps {
  hasStockIssues?: boolean;
}

export function CartSummary({ hasStockIssues = false }: CartSummaryProps) {
  const totalPrice = useTotalPrice();
  const totalItems = useTotalItems();
  const { closeCart } = useCartActions();

  if (totalItems === 0) return null;

  return (
    <div className="shrink-0 border-t border-[#d7d2c8] bg-[#eeece5] p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
      <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Bag summary</p>
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground">
        <span>Subtotal</span>
        <span className="font-serif text-2xl font-normal tracking-normal">{formatPrice(totalPrice)}</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Taxes & complimentary express shipping calculated at checkout
      </p>
      <div className="mt-5">
        {hasStockIssues ? (
          <Button
            disabled
            className="w-full rounded-none text-xs uppercase tracking-widest h-12 bg-destructive text-destructive-foreground"
          >
            Resolve stock issues to checkout
          </Button>
        ) : (
          <Button
            asChild
            className="h-12 w-full rounded-none bg-primary text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
            <Link href="/checkout" onClick={() => closeCart()}>
              Proceed to Checkout
            </Link>
          </Button>
        )}
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => closeCart()}
          className="text-[11px] uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );
}
