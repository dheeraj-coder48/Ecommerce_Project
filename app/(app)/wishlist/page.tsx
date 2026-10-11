"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Heart, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/app/ProductCard";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/store/wishlist-store-provider";

export default function WishlistPage() {
  const { openSignIn, user } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const products = useWishlistStore((state) => state.products);
  const status = useWishlistStore((state) => state.status);

  return (
    <section className="min-h-[65svh] bg-[#f6f4ef] px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="mx-auto max-w-[1520px]">
        <div className="mb-8 border-b border-[#dedbd3] pb-5 sm:mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-500">
            Saved for later
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="font-serif text-4xl font-light tracking-tight text-zinc-950 sm:text-5xl">
              My Wishlist
            </h1>
            <p
              className="text-xs uppercase tracking-[0.16em] text-zinc-500"
              aria-live="polite"
            >
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>

        {!isLoaded ? (
          <output className="flex min-h-64 items-center justify-center gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading your
            account
          </output>
        ) : !isSignedIn || !user ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
            <Heart className="h-8 w-8 stroke-[1.2] text-zinc-400" />
            <h2 className="mt-5 font-serif text-2xl font-light text-zinc-950">
              Sign in to view your Wishlist
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Your saved pieces will be ready whenever you return.
            </p>
            <Button className="mt-6" onClick={() => openSignIn({})}>
              Sign In
            </Button>
          </div>
        ) : status === "loading" ? (
          <output className="flex min-h-64 items-center justify-center gap-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading your
            wishlist
          </output>
        ) : status === "error" ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
            <h2 className="font-serif text-2xl font-light text-zinc-950">
              Your Wishlist could not be loaded
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Please refresh the page and try again.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-14 text-center sm:py-20">
            <Heart className="h-9 w-9 stroke-[1.2] text-zinc-400" />
            <h2 className="mt-5 font-serif text-3xl font-light text-zinc-950">
              Your Wishlist is Empty
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Save your favorite ethnic wear here and come back when you&apos;re
              ready to shop.
            </p>
            <Button asChild className="mt-7">
              <Link href="/?gender=men">Explore Collection</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
