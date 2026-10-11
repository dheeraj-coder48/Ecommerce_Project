import { defineQuery } from "next-sanity";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants/stock";

// ============================================
// Shared Query Fragments (DRY)
// ============================================

/** Common filter conditions for product filtering */
const PRODUCT_FILTER_CONDITIONS = `
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($color == "" || $color in coalesce(colors, select(defined(color) => [color], [])))
  && ($fabric == "" || fabric == $fabric)
  && ($gender == "" || gender == $gender)
  && ($size == "" || $size in size)
  && ($fit == "" || fit == $fit)
  && ($pattern == "" || pattern == $pattern)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
  && ($searchQuery == "" || name match $searchQuery + "*" || description match $searchQuery + "*")
  && ($inStock == false || stock > 0)
`;

/** Projection for filtered product lists (includes multiple images for hover) */
const FILTERED_PRODUCT_PROJECTION = `{
  _id,
  name,
  "slug": slug.current,
  price,
  "images": images[0...4]{
    _key,
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock
}`;

/** Scoring for relevance-based search */
const RELEVANCE_SCORE = `score(
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
)`;

// ============================================
// All Products Query
// ============================================

/**
 * Get all products with category expanded
 * Used on landing page
 */
export const ALL_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "images": images[]{
    _key,
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock,
  featured
}`);

/**
 * Get featured products for homepage carousel
 */
export const FEATURED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && featured == true
  && stock > 0
] | order(name asc) [0...6] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  gender,
  "images": images[]{
    _key,
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  stock
}`);

/**
 * Get products by category slug
 */
export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && category->slug.current == $categorySlug
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock
}`);

/**
 * Get single product by slug
 * Used on product detail page
 */
export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && slug.current == $slug
][0] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "images": images[]{
    _key,
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock,
  featured
}`);

// ============================================
// Search & Filter Queries (Server-Side)
// Uses GROQ score() for relevance ranking
// ============================================

/**
 * Search products with relevance scoring
 * Uses score() + boost() for better ranking
 * Orders by relevance score descending
 */
export const SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && (
    name match $searchQuery + "*"
    || description match $searchQuery + "*"
  )
] | score(
  boost(name match $searchQuery + "*", 3),
  boost(description match $searchQuery + "*", 1)
) | order(_score desc) {
  _id,
  _score,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock
}`);

/**
 * Filter products - ordered by name (A-Z)
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_NAME_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(name asc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/** Featured first, then newest products */
export const FILTER_PRODUCTS_BY_FEATURED_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(featured desc, _createdAt desc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/** Newest products first */
export const FILTER_PRODUCTS_BY_NEWEST_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(_createdAt desc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/**
 * Filter products - ordered by price ascending
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_PRICE_ASC_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(price asc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/**
 * Filter products - ordered by price descending
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_PRICE_DESC_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | order(price desc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/**
 * Filter products - ordered by relevance (when searching)
 * Uses score() for search term matching
 * Returns up to 4 images for hover preview in product cards
 */
export const FILTER_PRODUCTS_BY_RELEVANCE_QUERY = defineQuery(
  `*[${PRODUCT_FILTER_CONDITIONS}] | ${RELEVANCE_SCORE} | order(_score desc, name asc) ${FILTERED_PRODUCT_PROJECTION}`,
);

/**
 * Get products by IDs (for cart/checkout)
 */
export const PRODUCTS_BY_IDS_QUERY = defineQuery(`*[
  _type == "product"
  && _id in $ids
] {
  _id,
  name,
  "slug": slug.current,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    },
    hotspot
  },
  stock,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  size
}`);

/**
 * Get low stock products (admin)
 * Uses LOW_STOCK_THRESHOLD constant for consistency
 */
export const LOW_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock > 0
  && stock <= ${LOW_STOCK_THRESHOLD}
] | order(stock asc) {
  _id,
  name,
  "slug": slug.current,
  stock,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  }
}`);

/**
 * Get out of stock products (admin)
 */
export const OUT_OF_STOCK_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && stock == 0
] | order(name asc) {
  _id,
  name,
  "slug": slug.current,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  }
}`);

// ============================================
// AI Shopping Assistant Query
// Uses score() + boost() with all filters for AI agent
// ============================================

/**
 * Search products for AI shopping assistant
 * Full-featured search with all filters and product details
 */
export const AI_SEARCH_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product"
  && "men" in category->departments
  && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && (gender == "men")
  && (
    $searchQuery == ""
    || name match $searchQuery + "*"
    || description match $searchQuery + "*"
    || category->title match $searchQuery + "*"
  )
  && ($categorySlug == "" || category->slug.current == $categorySlug)
  && ($fabric == "" || fabric == $fabric)
  && ($color == "" || $color in coalesce(colors, select(defined(color) => [color], [])))
  && ($gender == "" || gender == $gender)
  && ($size == "" || $size in size)
  && ($fit == "" || fit == $fit)
  && ($pattern == "" || pattern == $pattern)
  && ($minPrice == 0 || price >= $minPrice)
  && ($maxPrice == 0 || price <= $maxPrice)
] | order(name asc) [0...20] {
  _id,
  name,
  "slug": slug.current,
  description,
  price,
  "image": images[0]{
    asset->{
      _id,
      url
    }
  },
  category->{
    _id,
    title,
    "slug": slug.current
  },
  fabric,
  "colors": coalesce(colors, select(defined(color) => [color], [])),
  gender,
  size,
  fit,
  pattern,
  stock,
  featured
}`);


