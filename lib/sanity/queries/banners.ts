import { defineQuery } from "next-sanity";
export const ACTIVE_BANNERS_QUERY = defineQuery(
  `*[_type == "banner" && active == true] | order(displayOrder asc, _createdAt asc) [0...8] { _id, title, subtitle, ctaText, ctaLink, destinationType, department, customUrl, "categorySlug": category->slug.current, "productSlug": product->slug.current, displayOrder, "image": image{ asset->{ _id, url }, crop, hotspot } }`,
);
