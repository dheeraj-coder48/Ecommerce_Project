"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  COLORS,
  FABRICS,
  FITS,
  PATTERNS,
  SIZES,
  SORT_OPTIONS,
} from "@/lib/constants/filters";
import { formatPrice } from "@/lib/utils";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

interface ProductFiltersProps {
  categories: ALL_CATEGORIES_QUERYResult;
}

const MAX_PRICE = 10000;

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("q") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const currentSize = searchParams.get("size") ?? "";
  const currentFabric = searchParams.get("fabric") ?? "";
  const currentColor = searchParams.get("color") ?? "";
  const currentFit = searchParams.get("fit") ?? "";
  const currentPattern = searchParams.get("pattern") ?? "";
  const currentSort = searchParams.get("sort") ?? "featured";
  const urlMinPrice = Number(searchParams.get("minPrice")) || 0;
  const urlMaxPrice = Number(searchParams.get("maxPrice")) || MAX_PRICE;
  const currentInStock = searchParams.get("inStock") === "true";

  // Local state for price range (for smooth slider dragging)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    urlMinPrice,
    urlMaxPrice,
  ]);

  // Sync local state when URL changes
  useEffect(() => {
    setPriceRange([urlMinPrice, urlMaxPrice]);
  }, [urlMinPrice, urlMaxPrice]);

  // Check which filters are active
  const isSearchActive = !!currentSearch;
  const isCategoryActive = !!currentCategory;
  const isSizeActive = !!currentSize;
  const isFabricActive = !!currentFabric;
  const isColorActive = !!currentColor;
  const isFitActive = !!currentFit;
  const isPatternActive = !!currentPattern;
  const isPriceActive = urlMinPrice > 0 || urlMaxPrice < MAX_PRICE;
  const isInStockActive = currentInStock;

  const hasActiveFilters =
    isSearchActive ||
    isCategoryActive ||
    isSizeActive ||
    isFabricActive ||
    isColorActive ||
    isFitActive ||
    isPatternActive ||
    isPriceActive ||
    isInStockActive;

  // Count active filters
  const activeFilterCount = [
    isSearchActive,
    isCategoryActive,
    isSizeActive,
    isFabricActive,
    isColorActive,
    isFitActive,
    isPatternActive,
    isPriceActive,
    isInStockActive,
  ].filter(Boolean).length;

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === 0) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get("search") as string;
    updateParams({ q: searchQuery || null });
  };

  const handleClearFilters = () => {
    router.push("/", { scroll: false });
  };

  const clearSingleFilter = (key: string) => {
    if (key === "price") {
      updateParams({ minPrice: null, maxPrice: null });
    } else {
      updateParams({ [key]: null });
    }
  };

  // Helper for filter label with active indicator
  const FilterLabel = ({
    children,
    isActive,
    filterKey,
  }: {
    children: React.ReactNode;
    isActive: boolean;
    filterKey: string;
  }) => (
    <div className="mb-2.5 flex items-center justify-between">
      <span
        className={`block text-[10px] uppercase tracking-[0.24em] font-semibold ${
          isActive
            ? "text-zinc-950 dark:text-zinc-50"
            : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {children}
        {isActive && (
          <span className="ml-2 inline-flex items-center bg-zinc-950 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium">
            Active
          </span>
        )}
      </span>
      {isActive && (
        <button
          type="button"
          onClick={() => clearSingleFilter(filterKey)}
          className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors p-0.5"
          aria-label={`Clear ${filterKey} filter`}
        >
          <X className="h-3 w-3 stroke-[1.5]" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 border border-[#e5e2da] bg-card p-5 dark:border-zinc-800">
      {/* Clear Filters Banner - Show at top when active */}
      {hasActiveFilters && (
        <div className="border border-[#e5e2da] bg-[#f8f6f0] p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-950 dark:text-zinc-100">
              {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "Filter" : "Filters"} Applied
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleClearFilters}
            className="w-full bg-zinc-950 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 h-9"
          >
            <X className="mr-1.5 h-3 w-3" />
            Reset All Filters
          </Button>
        </div>
      )}

      {/* Category */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isCategoryActive} filterKey="category">
          Garment Category
        </FilterLabel>
        <Select
          value={currentCategory || "all"}
          onValueChange={(value) =>
            updateParams({ category: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            className={`rounded-none ${
              isCategoryActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category.slug ?? ""}>
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Filter */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isSearchActive} filterKey="q">
          Search Garments
        </FilterLabel>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            name="search"
            placeholder="Silhouette, fabric, color..."
            defaultValue={currentSearch}
            className={`flex-1 rounded-none text-xs ${
              isSearchActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          />
          <Button type="submit" size="sm" className="rounded-none text-[10px] uppercase tracking-[0.16em] px-3.5">
            Find
          </Button>
        </form>
      </div>

      {/* Size Matrix */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isSizeActive} filterKey="size">
          Size
        </FilterLabel>
        <div className="grid grid-cols-3 gap-1.5">
          {SIZES.map((size) => {
            const isSelected = currentSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                onClick={() =>
                  updateParams({ size: isSelected ? null : size.value })
                }
                className={`py-2 text-[11px] font-medium uppercase tracking-wider transition-colors border ${
                  isSelected
                    ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-[#e5e2da] bg-transparent text-zinc-700 hover:border-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
                }`}
              >
                {size.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isFabricActive} filterKey="fabric">
          Fabric
        </FilterLabel>
        <Select
          value={currentFabric || "all"}
          onValueChange={(value) =>
            updateParams({ fabric: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            className={`rounded-none ${
              isFabricActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          >
            <SelectValue placeholder="All Fabrics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fabrics</SelectItem>
            {FABRICS.map((fabric) => (
              <SelectItem key={fabric.value} value={fabric.value}>
                {fabric.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fit */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isFitActive} filterKey="fit">
          Fit Style
        </FilterLabel>
        <Select
          value={currentFit || "all"}
          onValueChange={(value) =>
            updateParams({ fit: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            className={`rounded-none ${
              isFitActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          >
            <SelectValue placeholder="All Fits" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fits</SelectItem>
            {FITS.map((fit) => (
              <SelectItem key={fit.value} value={fit.value}>
                {fit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isColorActive} filterKey="color">
          Color
        </FilterLabel>
        <Select
          value={currentColor || "all"}
          onValueChange={(value) =>
            updateParams({ color: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            className={`rounded-none ${
              isColorActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          >
            <SelectValue placeholder="All Colors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colors</SelectItem>
            {COLORS.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                {color.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pattern */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isPatternActive} filterKey="pattern">
          Pattern
        </FilterLabel>
        <Select
          value={currentPattern || "all"}
          onValueChange={(value) =>
            updateParams({ pattern: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            className={`rounded-none ${
              isPatternActive
                ? "border-zinc-950 ring-1 ring-zinc-950 dark:border-zinc-100 dark:ring-zinc-100"
                : ""
            }`}
          >
            <SelectValue placeholder="All Patterns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patterns</SelectItem>
            {PATTERNS.map((pattern) => (
              <SelectItem key={pattern.value} value={pattern.value}>
                {pattern.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <FilterLabel isActive={isPriceActive} filterKey="price">
          Price: {formatPrice(priceRange[0])} — {formatPrice(priceRange[1])}
        </FilterLabel>
        <Slider
          min={0}
          max={MAX_PRICE}
          step={250}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          onValueCommit={([min, max]) =>
            updateParams({
              minPrice: min > 0 ? min : null,
              maxPrice: max < MAX_PRICE ? max : null,
            })
          }
          className={`mt-4 ${
            isPriceActive
              ? "[&_[role=slider]]:border-zinc-950 [&_[role=slider]]:ring-zinc-950 dark:[&_[role=slider]]:border-zinc-100"
              : ""
          }`}
        />
      </div>

      {/* In Stock Only */}
      <div className="border-b border-[#e5e2da] pb-5 dark:border-zinc-800/80">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) =>
              updateParams({ inStock: e.target.checked ? "true" : null })
            }
            className="h-4 w-4 rounded-none border-[#e5e2da] text-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span
            className={`text-[11px] uppercase tracking-wider font-medium ${
              isInStockActive
                ? "text-zinc-950 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            In-Stock Pieces Only
            {isInStockActive && (
              <span className="ml-2 inline-flex items-center bg-zinc-950 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.16em] text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium">
                Active
              </span>
            )}
          </span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <span className="mb-2 block text-[10px] uppercase tracking-[0.24em] font-semibold text-zinc-500 dark:text-zinc-400">
          Sort By
        </span>
        <Select
          value={currentSort}
          onValueChange={(value) => updateParams({ sort: value })}
        >
          <SelectTrigger className="rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
