import { ImagesIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
export const bannerType = defineType({
  name: "banner",
  title: "Homepage banner",
  type: "document",
  icon: ImagesIcon,
  fields: [
    defineField({
      name: "image",
      title: "Banner image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "subtitle", type: "string" }),
    defineField({ name: "ctaText", title: "Button text", type: "string" }),
    defineField({
      name: "destinationType",
      title: "Button destination",
      type: "string",
      options: {
        list: [
          { title: "Category", value: "category" },
          { title: "Product", value: "product" },
          { title: "Custom link", value: "custom" },
        ],
      },
      initialValue: "category",
    }),
    defineField({
      name: "department",
      title: "Department",
      type: "string",
      options: {
        list: [
          { title: "Men", value: "men" },
        ],
      },
      hidden: ({ document }) => document?.destinationType !== "category",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      options: {
        filter: ({ document }) =>
          document?.department
            ? {
                filter: "$department in departments",
                params: { department: document.department },
              }
            : {
                filter:
                  '"men" in departments && slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]',
              },
      },
      hidden: ({ document }) => document?.destinationType !== "category",
    }),
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      options: {
        filter: '"men" in category->departments && category->slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]',
      },
      hidden: ({ document }) => document?.destinationType !== "product",
    }),
    defineField({
      name: "customUrl",
      title: "Custom URL",
      type: "url",
      hidden: ({ document }) => document?.destinationType !== "custom",
    }),
    defineField({
      name: "active",
      title: "Published on homepage",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "displayOrder",
      type: "number",
      initialValue: 1,
      validation: (r) => r.required().integer().min(0),
    }),
  ],
});
