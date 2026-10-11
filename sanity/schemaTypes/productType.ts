import { PackageIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  COLORS_SANITY_LIST,
  FABRICS_SANITY_LIST,
  FITS_SANITY_LIST,
  GENDERS_SANITY_LIST,
  PATTERNS_SANITY_LIST,
  SIZES_SANITY_LIST,
} from "@/lib/constants/filters";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  icon: PackageIcon,
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "attributes", title: "Clothing Attributes" },
    { name: "media", title: "Lookbook / Media" },
    { name: "inventory", title: "Inventory & Pricing" },
  ],
  fields: [
    defineField({
      name: "name",
      type: "string",
      group: "details",
      validation: (rule) => [rule.required().error("Garment name is required")],
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),
    defineField({
      name: "description",
      type: "text",
      group: "details",
      rows: 4,
      description: "Garment description, styling notes, and care guide",
    }),
    defineField({
      name: "price",
      type: "number",
      group: "inventory",
      description: "Price in INR ₹ (e.g., 1499)",
      validation: (rule) => [
        rule.required().error("Price is required"),
        rule.positive().error("Price must be a positive number"),
      ],
    }),
    defineField({
      name: "category",
      type: "reference",
      to: [{ type: "category" }],
      options: {
        filter: ({ document }) => {
          return {
            filter: '"men" in departments && slug.current in ["kurtas", "kurta-sets", "sherwanis", "ethnic-wear", "nehru-jackets", "indo-western", "wedding-wear", "festive-wear", "ethnic-accessories"]',
          };
        },
      },
      group: "details",
      validation: (rule) => [rule.required().error("Category is required")],
    }),
    defineField({
      name: "gender",
      type: "string",
      group: "attributes",
      title: "Department",
      options: {
        list: GENDERS_SANITY_LIST,
        layout: "radio",
      },
      initialValue: "men",
    }),
    defineField({
      name: "fabric",
      type: "string",
      group: "attributes",
      title: "Fabric / Material",
      options: {
        list: FABRICS_SANITY_LIST,
      },
    }),
    defineField({
      name: "colors",
      title: "Available Colors",
      type: "array",
      group: "attributes",
      of: [
        defineArrayMember({
          type: "string",
          options: { list: COLORS_SANITY_LIST },
        }),
      ],
      options: { layout: "tags" },
      description:
        "Color choices for this design. Keep one product for all colors.",
    }),
    defineField({
      name: "size",
      type: "array",
      title: "Available Sizes",
      group: "attributes",
      of: [
        defineArrayMember({
          type: "string",
          options: { list: SIZES_SANITY_LIST },
        }),
      ],
      options: { layout: "tags" },
    }),
    defineField({
      name: "fit",
      type: "string",
      group: "attributes",
      title: "Fit Style",
      options: {
        list: FITS_SANITY_LIST,
      },
    }),
    defineField({
      name: "pattern",
      type: "string",
      group: "attributes",
      title: "Pattern",
      options: {
        list: PATTERNS_SANITY_LIST,
      },
    }),
    defineField({
      name: "images",
      type: "array",
      group: "media",
      of: [
        {
          type: "image",
          options: {
            hotspot: true,
          },
        },
      ],
      validation: (rule) => [
        rule.min(1).error("At least one garment image is required"),
      ],
    }),
    defineField({
      name: "stock",
      type: "number",
      group: "inventory",
      initialValue: 0,
      description: "Available inventory units",
      validation: (rule) => [
        rule.min(0).error("Stock cannot be negative"),
        rule.integer().error("Stock must be a whole number"),
      ],
    }),
    defineField({
      name: "featured",
      type: "boolean",
      group: "inventory",
      initialValue: false,
      description: "Feature in editorial highlights and homepage carousel",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "category.title",
      media: "images.0",
      price: "price",
    },
    prepare({ title, subtitle, media, price }) {
      return {
        title,
        subtitle: `${subtitle ? `${subtitle} • ` : ""}₹${price ?? 0}`,
        media,
      };
    },
  },
});

