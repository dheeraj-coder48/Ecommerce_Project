"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useCartActions,
  useCartItem,
  useCartItems,
} from "@/lib/store/cart-store-provider";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  color?: string;
  size?: string;
  slug?: string;
  requiresColor?: boolean;
  requiresSize?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  name,
  price,
  image,
  stock,
  color,
  size,
  slug,
  requiresColor = false,
  requiresSize = false,
  className,
}: AddToCartButtonProps) {
  const { addItem, updateQuantity } = useCartActions();
  const cartItem = useCartItem(productId, color, size);
  const cartItems = useCartItems();

  const quantityInCart = cartItem?.quantity ?? 0;
  const productQuantityInCart = cartItems
    .filter((item) => item.productId === productId)
    .reduce((total, item) => total + item.quantity, 0);
  const isOutOfStock = stock <= 0;
  const isAtMax = productQuantityInCart >= stock;

  const handleAdd = () => {
    if (requiresColor && !color) {
      toast.error("Please select a color.");
      return;
    }
    if (requiresSize && !size) {
      toast.error("Please select a size.");
      return;
    }
    if (productQuantityInCart < stock) {
      addItem({ productId, name, price, image, color, size, slug }, 1);
      toast.success(`Added ${name}`);
    }
  };

  const handleDecrement = () => {
    if (quantityInCart > 0) {
      updateQuantity(
        cartItem?.variantKey ?? `${productId}::${color ?? ""}::${size ?? ""}`,
        quantityInCart - 1,
      );
    }
  };

  // Out of stock
  if (isOutOfStock) {
    return (
      <Button
        disabled
        variant="secondary"
        className={cn("h-12 w-full rounded-none text-xs uppercase tracking-[0.2em] font-medium opacity-60", className)}
      >
        Sold Out
      </Button>
    );
  }

  // Not in cart - show Add to Bag button
  if (quantityInCart === 0) {
    return (
      <Button
        onClick={handleAdd}
        className={cn(
          "h-12 w-full rounded-none bg-zinc-950 text-xs font-semibold uppercase tracking-[0.22em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition-all shadow-none",
          className,
        )}
      >
        <ShoppingBag className="mr-2 h-4 w-4 stroke-[1.5]" />
        Add to Bag
      </Button>
    );
  }

  // In cart - show quantity controls
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center rounded-none border border-zinc-950 bg-background dark:border-white",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-full flex-1 rounded-none hover:bg-black/5 dark:hover:bg-white/10"
        onClick={handleDecrement}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5 stroke-[1.5]" />
      </Button>
      <span className="flex-1 text-center text-xs font-semibold uppercase tracking-wider tabular-nums">
        {quantityInCart} In Bag
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-full flex-1 rounded-none hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30"
        onClick={handleAdd}
        disabled={isAtMax}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
      </Button>
    </div>
  );
}
