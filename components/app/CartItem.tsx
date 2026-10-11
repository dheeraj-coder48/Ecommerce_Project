"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import { Button } from "@/components/ui/button";
import type { StockInfo } from "@/lib/hooks/useCartStock";
import {
  type CartItem as CartItemType,
  cartVariantKey,
} from "@/lib/store/cart-store";
import { useCartActions } from "@/lib/store/cart-store-provider";
import { cn, formatColorName, formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
  stockInfo?: StockInfo;
}

export function CartItem({ item, stockInfo }: CartItemProps) {
  const { removeItem } = useCartActions();

  const isOutOfStock = stockInfo?.isOutOfStock ?? false;
  const exceedsStock = stockInfo?.exceedsStock ?? false;
  const currentStock = stockInfo?.currentStock ?? 999;
  const hasIssue = isOutOfStock || exceedsStock;

  return (
    <div
      className={cn(
        "flex gap-4 py-4 transition-colors bg-background",
        hasIssue && "bg-destructive/5 p-3 dark:bg-destructive/20",
      )}
    >
      {/* 3:4 Fashion Image Thumbnail */}
      <div
        className={cn(
          "relative h-24 w-18 shrink-0 overflow-hidden bg-background border border-border",
          isOutOfStock && "opacity-50",
        )}
      >
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
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <Link
              href={item.slug ? `/products/${item.slug}` : "/"}
              className={cn(
                "text-xs uppercase tracking-wider font-medium text-foreground hover:text-foreground/70 dark:text-foreground dark:hover:text-foreground/70 line-clamp-2",
                isOutOfStock && "text-zinc-400 dark:text-zinc-500",
              )}
            >
              {item.name}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
              onClick={() =>
                removeItem(item.variantKey ?? cartVariantKey(item))
              }
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {(item.color || item.size) && (
            <p className="mt-1 text-xs text-foreground/70">
              {[
                item.color && `Color: ${formatColorName(item.color)}`,
                item.size && `Size: ${item.size}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <p className="mt-1 text-xs font-semibold text-foreground">
            {formatPrice(item.price)}
          </p>
        </div>

        {/* Stock Status & Quantity Controls */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <StockBadge productId={item.productId} stock={currentStock} />
          {!isOutOfStock && (
            <div className="w-28 max-w-[45%]">
              <AddToCartButton
                productId={item.productId}
                slug={item.slug}
                name={item.name}
                price={item.price}
                image={item.image}
                stock={currentStock}
                color={item.color}
                size={item.size}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
