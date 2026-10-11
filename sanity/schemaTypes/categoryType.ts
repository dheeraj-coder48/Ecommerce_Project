import { TagIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  icon: TagIcon,
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => [
        rule.required().error("Category title is required"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => [
        rule.required().error("Slug is required for URL generation"),
      ],
    }),
    defineField({
      name: "departments",
      title: "Departments",
      type: "array",
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Men", value: "men" },
            ],
          },
        }),
      ],
      options: { layout: "tags" },
      description: "Assign this category to the men's ethnic wear collection.",
    }),
    defineField({
      name: "image",
      type: "image",
      options: {
        hotspot: true,
      },
      description: "Category thumbnail image",
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
    },
  },
});

