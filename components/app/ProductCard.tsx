"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { StockBadge } from "@/components/app/StockBadge";
import { WishlistToggle } from "@/components/app/WishlistToggle";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { WishlistProduct } from "@/lib/store/wishlist-store";
import { cn, formatPrice } from "@/lib/utils";

type Product = WishlistProduct;

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images ?? [];
  const mainImageUrl = images[0]?.asset?.url;
  const secondaryImageUrl = images[1]?.asset?.url ?? mainImageUrl;

  const stock = product.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const colors = product.colors ?? [];
  const sizes = product.size ?? [];

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden rounded-sm border border-[#dedbd3] bg-transparent p-0 shadow-none dark:border-zinc-800 dark:bg-transparent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block relative overflow-hidden"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#e9e5dc] dark:bg-zinc-900">
          {mainImageUrl ? (
            <>
              {/* Primary product image */}
              <Image
                src={mainImageUrl}
                alt={product.name ?? "Clothing item"}
                fill
                className={cn(
                  "object-cover object-top transition-all duration-700 ease-out",
                  secondaryImageUrl &&
                    isHovered &&
                    secondaryImageUrl !== mainImageUrl
                    ? "opacity-0 scale-100"
                    : "opacity-100 group-hover:scale-[1.03]",
                )}
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
              {/* Secondary Alternate Angle Image */}
              {secondaryImageUrl && secondaryImageUrl !== mainImageUrl && (
                <Image
                  src={secondaryImageUrl}
                  alt={`${product.name} alternate view`}
                  fill
                  className={cn(
                    "object-cover object-top transition-all duration-700 ease-out",
                    isHovered
                      ? "opacity-100 scale-[1.03]"
                      : "opacity-0 scale-100",
                  )}
                  sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <span className="text-[10px] uppercase tracking-[0.24em]">
                Clothing item
              </span>
            </div>
          )}

          {/* Minimalist Editorial Tags */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent px-3 pb-3 pt-12">
            {product.category && (
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">
                {product.category.title}
              </span>
            )}
            {product.gender && (
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/80">
                {product.gender}
              </span>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute top-3 right-3 z-10">
              <span className="bg-zinc-950 text-white px-2.5 py-0.5 text-[9px] uppercase tracking-[0.24em] font-medium border border-white/20">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </Link>

      <WishlistToggle product={product} />

      <CardContent className="flex grow flex-col justify-between px-2.5 pt-2.5 pb-1">
        <div>
          {/* Garment details subtitle */}
          {(product.fabric || product.fit) && (
            <p className="mb-0.5 text-[9px] uppercase tracking-[0.16em] text-zinc-500 font-medium">
              {[product.fabric, product.fit].filter(Boolean).join(" · ")}
            </p>
          )}

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-1 font-sans text-sm font-medium tracking-[-0.01em] text-zinc-950 dark:text-zinc-100 transition-colors group-hover:text-[#793c35] sm:text-base">
              {product.name}
            </h3>
          </Link>
          {colors.length > 1 && (
            <p className="mt-0.5 text-[10px] text-zinc-500 font-light">
              {colors.length} colours
            </p>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-[#dedbd3] pt-1.5 dark:border-zinc-800">
          <p className="font-sans text-base font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[17px]">
            {formatPrice(product.price)}
          </p>
          <StockBadge productId={product._id} stock={stock} />
        </div>
      </CardContent>

      <CardFooter className="mt-auto px-2.5 pt-0.5 pb-2">
        {colors.length > 1 || sizes.length > 0 ? (
          <Link
            href={`/products/${product.slug}`}
            className="flex h-8 w-full items-center justify-between border-b border-[#b9b3a9] bg-transparent px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-800 transition-all hover:border-zinc-950 hover:text-[#793c35] dark:border-zinc-700 dark:text-zinc-200"
          >
            <span>Select options</span>
            <span aria-hidden="true">↗</span>
          </Link>
        ) : (
          <AddToCartButton
            productId={product._id}
            slug={product.slug ?? undefined}
            name={product.name ?? "Clothing Piece"}
            price={product.price ?? 0}
            image={mainImageUrl ?? undefined}
            stock={stock}
            color={colors[0]}
            className="rounded-none h-9 text-[10px] uppercase tracking-[0.16em]"
          />
        )}
      </CardFooter>
    </Card>
  );
}
