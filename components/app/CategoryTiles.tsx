"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChatActions } from "@/lib/store/chat-store-provider";
import type { ALL_CATEGORIES_QUERYResult } from "@/sanity.types";

const categoryFallbackImages: Record<string, string> = {
  "ethnic-wear": "/category-images/ethnic-wear.png",
  "kurta-sets": "/category-images/kurta-sets.png",
  kurtas: "/category-images/kurtas.png",
  "nehru-jackets": "/category-images/nehru-jackets.png",
  sherwanis: "/category-images/sherwanis.webp",
};
const allCollectionsImage = "/category-images/all-collections.png";

interface CategoryTilesProps {
  categories: ALL_CATEGORIES_QUERYResult;
  activeCategory?: string;
  department?: string;
}

export function CategoryTiles({
  categories,
  activeCategory,
  department,
}: CategoryTilesProps) {
  const { openChat } = useChatActions();
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateScrollControls = () => {
      setCanScrollLeft(rail.scrollLeft > 1);
      setCanScrollRight(
        rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1,
      );
    };

    updateScrollControls();
    rail.addEventListener("scroll", updateScrollControls, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollControls);
    const mutationObserver = new MutationObserver(updateScrollControls);
    resizeObserver.observe(rail);
    mutationObserver.observe(rail, { childList: true, subtree: true });

    return () => {
      rail.removeEventListener("scroll", updateScrollControls);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const scrollRail = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left:
        direction === "right"
          ? rail.clientWidth * 0.8
          : -rail.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  const featuredCategories = [
    { slug: "ethnic-wear", title: "Ethnic Wear" },
    { slug: "kurta-sets", title: "Kurta Sets" },
    { slug: "kurtas", title: "Kurtas" },
    { slug: "nehru-jackets", title: "Nehru Jackets" },
    { slug: "sherwanis", title: "Sherwanis" },
  ].map((item) => ({
    ...item,
    category: categories.find((category) => category.slug === item.slug),
  }));
  const fallbackImageUrl =
    categories.find((category) => category.image?.asset?.url)?.image?.asset
      ?.url ?? categoryFallbackImages["ethnic-wear"];

  return (
    <div className="relative">
      {/* Horizontal scrolling lookbook container */}
      <section
        ref={railRef}
        aria-label="Browse collection categories"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-2 px-4 sm:gap-4 sm:px-8 lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-12 scrollbar-hide"
      >
        {/* All Garments tile */}
        <Link
          href={`/?gender=${department ?? "men"}`}
          className={`group relative w-[68vw] flex-shrink-0 snap-start cursor-pointer overflow-hidden border transition-all duration-300 sm:w-[calc((100%-2rem)/3)] lg:w-full ${
            !activeCategory
              ? "border-zinc-950 dark:border-white ring-1 ring-zinc-950 dark:ring-white"
              : "border-zinc-200 hover:border-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-600"
          }`}
        >
          <div className="relative aspect-[3/4] w-full bg-[#1b231d]">
            <Image
              src={allCollectionsImage}
              alt="A curated collection of men's ethnic wear"
              fill
              sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 68vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />

            {/* Dark editorial gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-colors duration-300 group-hover:from-black/75" />

            {/* Category label */}
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between">
              <div>
                <span className="block text-[8px] font-medium uppercase tracking-[0.24em] text-white/75">
                  Curation
                </span>
                <span className="font-serif text-xl font-medium text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:text-2xl">
                  All Collections
                </span>
              </div>
              {!activeCategory && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>
        </Link>

        {/* Category tiles */}
        {featuredCategories.map(({ slug, title, category }) => {
          const isActive = activeCategory === slug;
          const imageUrl =
            category?.image?.asset?.url ??
            categoryFallbackImages[slug] ??
            fallbackImageUrl;

          return (
            <Link
              key={slug}
              href={`/?${department ? `gender=${department}&` : ""}category=${slug}`}
              className={`group relative w-[68vw] flex-shrink-0 snap-start cursor-pointer overflow-hidden border transition-all duration-300 sm:w-[calc((100%-2rem)/3)] lg:w-full ${
                isActive
                  ? "border-zinc-950 dark:border-white ring-1 ring-zinc-950 dark:ring-white"
                  : "border-zinc-200 hover:border-zinc-500 dark:border-zinc-800 dark:hover:border-zinc-600"
              }`}
            >
              <div className="relative aspect-[3/4] w-full bg-[#252c26]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 68vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#252c26]" />
                )}

                {/* Refined gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-colors duration-300 group-hover:from-black/75" />

                {/* Category label */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between">
                  <div>
                    <span className="block text-[8px] font-medium uppercase tracking-[0.24em] text-white/75">
                      Category
                    </span>
                    <span className="font-serif text-xl font-medium text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:text-2xl">
                      {title}
                    </span>
                  </div>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {!activeCategory && !department && (
        <div className="mx-4 mt-4 flex flex-col gap-4 border border-[#b08d57]/45 bg-[#f2ede4] px-5 py-4 sm:mx-8 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:mx-12">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[#1f3a2e]" aria-hidden="true" />
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#1f3a2e]">AI Fashion Stylist</p>
              <p className="mt-1 font-serif text-lg text-[#1a1a1a] sm:text-xl">A considered look for every occasion.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openChat}
            className="inline-flex w-fit cursor-pointer items-center gap-2 border border-[#1f3a2e] bg-transparent px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.16em] text-[#1f3a2e] transition-colors duration-200 hover:bg-[#1f3a2e] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
          >
            Try AI Stylist <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollRail("left")}
          aria-label="Previous categories"
          className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center border border-zinc-200 bg-white/95 text-zinc-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 md:flex lg:hidden"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollRail("right")}
          aria-label="Next categories"
          className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center border border-zinc-200 bg-white/95 text-zinc-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 md:flex lg:hidden"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
