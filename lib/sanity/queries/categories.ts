import { defineQuery } from "next-sanity";

/**
 * Get all categories
 * Used for navigation and filters
 */
export const ALL_CATEGORIES_QUERY = defineQuery(`*[
  _type == "category"
  && "men" in departments
  && slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  departments,
  "image": image{
    asset->{
      _id,
      url
    },
    hotspot
  }
}`);

/**
 * Get category by slug
 */
export const CATEGORY_BY_SLUG_QUERY = defineQuery(`*[
  _type == "category"
  && "men" in departments
  && slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]
  && slug.current == $slug
][0] {
  _id,
  title,
  "slug": slug.current,
  "image": image{
    asset->{
      _id,
      url
    },
    hotspot
  }
}`);

