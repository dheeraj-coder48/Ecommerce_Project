import { CategoryTiles } from "@/components/app/CategoryTiles";
import { FeaturedCarousel } from "@/components/app/FeaturedCarousel";
import { ProductSection } from "@/components/app/ProductSection";
import { ACTIVE_BANNERS_QUERY } from "@/lib/sanity/queries/banners";
import { ALL_CATEGORIES_QUERY } from "@/lib/sanity/queries/categories";
import {
  FEATURED_PRODUCTS_QUERY,
  FILTER_PRODUCTS_BY_FEATURED_QUERY,
  FILTER_PRODUCTS_BY_NAME_QUERY,
  FILTER_PRODUCTS_BY_NEWEST_QUERY,
  FILTER_PRODUCTS_BY_PRICE_ASC_QUERY,
  FILTER_PRODUCTS_BY_PRICE_DESC_QUERY,
  FILTER_PRODUCTS_BY_RELEVANCE_QUERY,
} from "@/lib/sanity/queries/products";
import { sanityFetch } from "@/sanity/lib/live";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    gender?: string;
    size?: string;
    fabric?: string;
    color?: string;
    fit?: string;
    pattern?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const searchQuery = params.q ?? "";
  const categorySlug = params.category ?? "";
  const gender = params.gender ?? "";
  const size = params.size ?? "";
  const fabric = params.fabric ?? "";
  const color = params.color ?? "";
  const fit = params.fit ?? "";
  const pattern = params.pattern ?? "";
  const minPrice = Number(params.minPrice) || 0;
  const maxPrice = Number(params.maxPrice) || 0;
  const sort = params.sort ?? "featured";
  const inStock = params.inStock === "true";

  // Select query based on sort parameter
  const getQuery = () => {
    if (searchQuery && sort === "relevance") {
      return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
    }

    switch (sort) {
      case "price_asc":
        return FILTER_PRODUCTS_BY_PRICE_ASC_QUERY;
      case "price_desc":
        return FILTER_PRODUCTS_BY_PRICE_DESC_QUERY;
      case "newest":
        return FILTER_PRODUCTS_BY_NEWEST_QUERY;
      case "featured":
        return FILTER_PRODUCTS_BY_FEATURED_QUERY;
      case "relevance":
        return FILTER_PRODUCTS_BY_RELEVANCE_QUERY;
      default:
        return FILTER_PRODUCTS_BY_NAME_QUERY;
    }
  };

  // Fetch products with filters (server-side via GROQ)
  const { data: products } = await sanityFetch({
    query: getQuery(),
    params: {
      searchQuery,
      categorySlug,
      gender,
      size,
      fabric,
      color,
      fit,
      pattern,
      minPrice,
      maxPrice,
      inStock,
    },
  });

  // Fetch categories for filter sidebar & category tiles
  const { data: categories } = await sanityFetch({
    query: ALL_CATEGORIES_QUERY,
  });

  // Fetch featured products for carousel
  const { data: featuredProducts } = await sanityFetch({
    query: FEATURED_PRODUCTS_QUERY,
  });

  const { data: banners } = await sanityFetch({ query: ACTIVE_BANNERS_QUERY });

  const showEditorialHero = !(
    searchQuery ||
    categorySlug ||
    gender ||
    size ||
    fabric ||
    color ||
    fit ||
    pattern ||
    minPrice ||
    maxPrice ||
    inStock
  );

  return (
    <div className="min-h-screen bg-background">
      {showEditorialHero &&
        (featuredProducts.length > 0 || banners.length > 0) && (
          <FeaturedCarousel products={featuredProducts} banners={banners} />
        )}
      {showEditorialHero &&
        featuredProducts.length === 0 &&
        banners.length === 0 && (
          <section
            id="homepage-hero"
            className="flex h-[100svh] flex-col justify-center bg-white px-6 sm:px-12 lg:px-[10%]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              TRADITIONAL, REFINED, TIMELESS
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[1.02] tracking-tight text-zinc-950 sm:text-7xl">
              Men's ethnic wear
              <br className="hidden sm:block" /> for every occasion.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
              Traditional Indian clothing for weddings, festivals and
              celebrations.
            </p>
            <div className="mt-8 flex gap-3">
              <a
                href="/?gender=men"
                className="bg-zinc-950 px-6 py-3 text-[10px] font-semibold uppercase tracking-[.16em] text-white"
              >
                Explore the collection
              </a>
            </div>
          </section>
        )}
      {/* Editorial Collection Banner & Categories */}
      <div className="border-y border-zinc-200 bg-white dark:border-zinc-800/80">
        <div className="mx-auto max-w-[1520px] px-4 pt-12 pb-3 sm:px-8 sm:pt-14 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
                {searchQuery ? "Collection Search" : "Men's Ethnic Collection"}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-4xl lg:text-[2.6rem]">
                {categorySlug
                  ? `${categorySlug.replace("-", " ")} Collection`
                  : searchQuery
                    ? "Search the collection"
                    : "Traditional & Contemporary Indian Wear"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md font-light leading-relaxed">
              Explore traditional Indian wear for weddings, festivals and every
              important celebration.
            </p>
          </div>
        </div>

        {/* Category Lookbook Strip */}
        <div className="mt-6 pb-6">
          <CategoryTiles
            categories={categories}
            activeCategory={categorySlug || undefined}
            department={gender || undefined}
          />
        </div>
      </div>

      {/* Products & Filters Section */}
      <div className="mx-auto max-w-[1520px] px-4 py-10 sm:px-8 lg:px-12">
        <ProductSection
          categories={categories}
          products={products}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
