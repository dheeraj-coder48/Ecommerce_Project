"use client";

import { useClerk } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { WishlistProduct } from "@/lib/store/wishlist-store";
import { useWishlistStore } from "@/lib/store/wishlist-store-provider";

interface WishlistToggleProps {
  product: WishlistProduct;
  variant?: "icon" | "detail";
  className?: string;
}

export function WishlistToggle({
  product,
  variant = "icon",
  className = "",
}: WishlistToggleProps) {
  const { openSignIn, user } = useClerk();
  const products = useWishlistStore((state) => state.products);
  const status = useWishlistStore((state) => state.status);
  const pendingIds = useWishlistStore((state) => state.pendingIds);
  const addProduct = useWishlistStore((state) => state.addProduct);
  const removeProduct = useWishlistStore((state) => state.removeProduct);
  const setPending = useWishlistStore((state) => state.setPending);
  const [localPending, setLocalPending] = useState(false);
  const isSaved = products.some((item) => item._id === product._id);
  const pending = localPending || pendingIds.includes(product._id);

  async function toggle() {
    if (!user) {
      toast.info("Sign in to save products to your wishlist.");
      openSignIn({});
      return;
    }
    if (pending || status === "loading") return;

    setLocalPending(true);
    setPending(product._id, true);
    try {
      const response = await fetch("/api/wishlist", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          toast.info("Sign in to save products to your wishlist.");
          openSignIn({});
          return;
        }
        throw new Error(result.error ?? "Wishlist could not be updated.");
      }
      if (isSaved) {
        removeProduct(product._id);
        toast.success("Removed from wishlist");
      } else {
        addProduct(product);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Wishlist could not be updated.",
      );
    } finally {
      setLocalPending(false);
      setPending(product._id, false);
    }
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isSaved}
        className={`inline-flex min-h-10 cursor-pointer items-center gap-2 border border-[#dedbd3] px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-800 transition-colors hover:border-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 ${className}`}
      >
        <Heart
          className={`h-4 w-4 ${isSaved ? "fill-[#793c35] text-[#793c35]" : ""}`}
        />
        <span>{isSaved ? "Added to Wishlist" : "Add to Wishlist"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={
        isSaved
          ? `Remove ${product.name ?? "product"} from wishlist`
          : `Add ${product.name ?? "product"} to wishlist`
      }
      aria-pressed={isSaved}
      title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`absolute right-2 top-2 z-20 flex h-9 w-9 cursor-pointer items-center justify-center border border-[#dedbd3]/80 bg-[#faf7f2]/95 text-zinc-800 transition-colors hover:border-zinc-900 hover:text-[#793c35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 ${className}`}
    >
      <Heart
        className={`h-4 w-4 ${isSaved ? "fill-[#793c35] text-[#793c35]" : ""}`}
      />
    </button>
  );
}
