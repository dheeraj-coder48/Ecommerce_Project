import { HeartIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const wishlistType = defineType({
  name: "wishlist",
  title: "Wishlist",
  type: "document",
  icon: HeartIcon,
  fields: [
    defineField({
      name: "clerkUserId",
      type: "string",
      title: "Clerk User ID",
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "items",
      type: "array",
      title: "Saved Products",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "product" }],
        }),
      ],
    }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "clerkUserId", count: "items.length" },
    prepare: ({ title, count }) => ({
      title: "Customer Wishlist",
      subtitle: `${count ?? 0} saved products · ${title ?? ""}`,
    }),
  },
});
