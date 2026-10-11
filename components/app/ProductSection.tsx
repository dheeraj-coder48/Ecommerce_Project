"use client";

import { Filter, PanelLeft, PanelLeftClose } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  ALL_CATEGORIES_QUERYResult,
  FILTER_PRODUCTS_BY_NAME_QUERYResult,
} from "@/sanity.types";
import { ProductFilters } from "./ProductFilters";
import { ProductGrid } from "./ProductGrid";

interface ProductSectionProps {
  categories: ALL_CATEGORIES_QUERYResult;
  products: FILTER_PRODUCTS_BY_NAME_QUERYResult;
  searchQuery: string;
}

export function ProductSection({
  categories,
  products,
  searchQuery,
}: ProductSectionProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      {/* Editorial Header with results count and filter toggle */}
      <div className="flex items-center justify-between gap-4 border-b border-[#e5e2da] pb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] font-medium text-zinc-500 dark:text-zinc-400">
          Showing <span className="font-semibold text-zinc-950 dark:text-white">{products.length}</span> {products.length === 1 ? "Garment" : "Garments"}
          {searchQuery && (
            <span>
              {" "}
              matching &ldquo;<span className="text-zinc-950 dark:text-white">{searchQuery}</span>&rdquo;
            </span>
          )}
        </p>

        {/* Filter toggle button (Desktop) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="hidden items-center gap-2 border-[#e5e2da] bg-transparent text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors hover:border-zinc-950 hover:bg-transparent hover:text-zinc-950 dark:border-zinc-800 dark:hover:border-white lg:flex h-8.5 px-3.5"
          aria-label={filtersOpen ? "Hide filters" : "Show filters"}
          aria-expanded={filtersOpen}
        >
          {filtersOpen ? (
            <>
              <PanelLeftClose className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Hide Filters</span>
            </>
          ) : (
            <>
              <PanelLeft className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>Filter Catalog</span>
            </>
          )}
        </Button>

        {/* Mobile Filter Trigger Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#e5e2da] bg-transparent text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-900 dark:text-zinc-100 lg:hidden h-8.5 px-3.5"
            >
              <Filter className="h-3.5 w-3.5 stroke-[1.5]" />
              Refine ({products.length})
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(92vw,400px)] overflow-y-auto rounded-none border-r border-[#e5e2da] bg-[#faf8f5] p-6 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <SheetHeader className="mb-6 border-b border-[#e5e2da] pb-4 text-left dark:border-zinc-800">
              <SheetTitle className="font-serif text-2xl font-light tracking-wide text-zinc-950 dark:text-white">
                Refine Selection
              </SheetTitle>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Filter ethnic wear by category, fabric, color, size and occasion
              </p>
            </SheetHeader>
            <ProductFilters categories={categories} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content area */}
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Sidebar Filters - desktop */}
        <aside
          className={`hidden shrink-0 transition-all duration-300 ease-in-out lg:block ${filtersOpen ? "lg:w-68 lg:opacity-100" : "lg:hidden"}`}
        >
          <ProductFilters categories={categories} />
        </aside>

        {/* Product Grid - expands to full width when filters hidden */}
        <main className="flex-1 transition-all duration-300">
          <ProductGrid products={products} />
        </main>
      </div>
    </div>
  );
}
