"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/app/AddToCartButton";
import { AskAISimilarButton } from "@/components/app/AskAISimilarButton";
import { DeliveryChecker } from "@/components/app/DeliveryChecker";
import { StockBadge } from "@/components/app/StockBadge";
import { WishlistToggle } from "@/components/app/WishlistToggle";
import { COLORS } from "@/lib/constants/filters";
import { formatPrice } from "@/lib/utils";
import type { PRODUCT_BY_SLUG_QUERYResult } from "@/sanity.types";

interface ProductInfoProps {
  product: NonNullable<PRODUCT_BY_SLUG_QUERYResult>;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const imageUrl = product.images?.[0]?.asset?.url;
  const colors = product.colors ?? [];
  const availableSizes = product.size ?? [];
  const [selectedColor, setSelectedColor] = useState(
    colors.length === 1 ? colors[0] : "",
  );
  const [selectedSize, setSelectedSize] = useState(
    availableSizes.length === 1 ? availableSizes[0] : "",
  );
  const colorLabel = (value: string) =>
    COLORS.find((entry) => entry.value === value)?.label ?? value;
  const colorSwatch: Record<string, string> = {
    black: "#242424",
    white: "#faf9f6",
    navy: "#27364d",
    grey: "#92918d",
    beige: "#d7c6a7",
    brown: "#705442",
    olive: "#596044",
    burgundy: "#713d47",
    blue: "#82a9c1",
    red: "#a64c44",
    green: "#52745c",
    pink: "#d6a4aa",
    yellow: "#d4a62a",
    orange: "#d97732",
  };

  return (
    <div className="flex min-w-0 flex-col py-2 lg:py-0">
      {/* Category / Department Breadcrumb */}
      <div className="hidden min-w-0 flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-zinc-400 lg:flex">
        {product.gender && (
          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
            {product.gender}
          </span>
        )}
        {product.gender && product.category && <span>/</span>}
        {product.category && (
          <Link
            href={`/?category=${product.category.slug}`}
            className="min-w-0 break-words transition-colors hover:text-zinc-950 dark:hover:text-white [overflow-wrap:anywhere]"
          >
            {product.category.title}
          </Link>
        )}
      </div>

      {/* Garment Title */}
      <h1 className="mt-2 break-words font-serif text-3xl font-light leading-[1.08] tracking-tight text-zinc-950 dark:text-white sm:text-4xl lg:text-[2.35rem] [overflow-wrap:anywhere]">
        {product.name}
      </h1>
      <div className="mt-3 max-w-full">
        <WishlistToggle product={product} variant="detail" />
      </div>

      {/* Price & Shipping Highlight */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-sans text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          {formatPrice(product.price)}
        </p>
        <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-400">
          Tax Included · Complimentary Shipping
        </span>
      </div>

      {/* Description */}
      {product.description && (
        <p className="mt-3 max-w-xl break-words text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-light [overflow-wrap:anywhere]">
          {product.description}
        </p>
      )}

      {/* Color Selector */}
      {colors.length > 0 && (
        <section
          className="mt-4 border-t border-[#e5e2da] pt-3.5 dark:border-zinc-800"
          aria-labelledby="color-title"
        >
          <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
            <h2
              id="color-title"
              className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400"
            >
              Shade
            </h2>
            <span className="min-w-0 break-words text-right text-[11px] font-medium uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {selectedColor ? colorLabel(selectedColor) : "Please Select"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${colorLabel(color)}`}
                  className={`inline-flex min-h-11 max-w-full items-center gap-2 border px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all ${
                    isSelected
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-[#e5e2da] bg-transparent text-zinc-800 hover:border-zinc-950 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-white"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 rounded-full border ${color === "white" ? "border-zinc-300" : "border-black/10"}`}
                    style={{ backgroundColor: colorSwatch[color] ?? "#e8e5de" }}
                  />
                  {isSelected && <Check className="h-3 w-3 stroke-[2]" />}
                  {colorLabel(color)}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Size Selector */}
      {availableSizes.length > 0 && (
        <section className="mt-3.5 border-t border-[#e5e2da] pt-3.5 dark:border-zinc-800">
          <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
              Size
            </h2>
            <span className="min-w-0 break-words text-right text-[11px] font-medium uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {selectedSize || "Please Select"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  aria-pressed={isSelected}
                  className={`h-11 min-w-11 border px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                    isSelected
                      ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-[#e5e2da] text-zinc-800 hover:border-zinc-950 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-white"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Stock & Purchase Actions */}
      <div className="mt-4 space-y-2.5 border-t border-[#e5e2da] pt-4 dark:border-zinc-800">
        <StockBadge productId={product._id} stock={product.stock ?? 0} />
        <AddToCartButton
          productId={product._id}
          slug={product.slug ?? undefined}
          name={product.name ?? "Clothing item"}
          price={product.price ?? 0}
          image={imageUrl ?? undefined}
          stock={product.stock ?? 0}
          color={selectedColor || undefined}
          size={selectedSize || undefined}
          requiresColor={colors.length > 1}
          requiresSize={availableSizes.length > 0}
        />
        <AskAISimilarButton
          productName={product.name ?? "this piece"}
          colors={colors.map(colorLabel)}
        />
      </div>

      <div className="order-3 lg:order-none">
        <DeliveryChecker />
      </div>

      {/* Sartorial Details Spec Table */}
      {(product.fabric || product.fit || product.pattern) && (
        <section className="order-2 mt-5 border-t border-[#e5e2da] pt-4 dark:border-zinc-800 lg:order-none">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
            Garment Specifications
          </h2>
          <dl className="divide-y divide-[#e5e2da] text-xs dark:divide-zinc-800">
            {[
              ["Fabrication", product.fabric],
              ["Fit & Silhouette", product.fit],
              ["Pattern / Weave", product.pattern],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label} className="flex min-w-0 justify-between gap-4 py-2">
                  <dt className="max-w-[48%] break-words font-medium uppercase tracking-[0.12em] text-zinc-400 sm:tracking-[0.16em]">
                    {label}
                  </dt>
                  <dd className="min-w-0 break-words text-right font-semibold uppercase tracking-wider text-zinc-950 dark:text-zinc-100 [overflow-wrap:anywhere]">
                    {value}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      )}
    </div>
  );
}
