import { tool } from "ai";
import { z } from "zod";
import type { SearchProduct } from "@/lib/ai/types";
import {
  COLOR_VALUES,
  FABRIC_VALUES,
  FIT_VALUES,
  GENDER_VALUES,
  PATTERN_VALUES,
  SIZE_VALUES,
} from "@/lib/constants/filters";
import { getStockMessage, getStockStatus } from "@/lib/constants/stock";
import { AI_SEARCH_PRODUCTS_QUERY } from "@/lib/sanity/queries/products";
import { formatColorName, formatPrice } from "@/lib/utils";
import { sanityFetch } from "@/sanity/lib/live";
import type { AI_SEARCH_PRODUCTS_QUERYResult } from "@/sanity.types";

const productSearchSchema = z.object({
  query: z
    .string()
    .optional()
    .default("")
    .describe(
      "Search term to find products by name, description, or category (e.g., 'silk kurta', 'wedding sherwani', 'festive kurta set')",
    ),
  category: z
    .string()
    .optional()
    .default("")
    .describe(
      "Filter by category slug (e.g., 'kurtas', 'kurta-sets', 'sherwanis', 'nehru-jackets')",
    ),
  fabric: z
    .enum(["", ...FABRIC_VALUES])
    .optional()
    .default("")
    .describe("Filter by fabric/material (e.g., 'cotton', 'linen', 'silk')"),
  color: z
    .enum(["", ...COLOR_VALUES])
    .optional()
    .default("")
    .describe("Filter by color (e.g., 'black', 'white', 'navy', 'beige')"),
  gender: z
    .enum(["", ...GENDER_VALUES])
    .optional()
    .default("")
    .describe("Filter by gender target ('men' only)"),
  size: z
    .enum(["", ...SIZE_VALUES])
    .optional()
    .default("")
    .describe("Filter by available size ('XS', 'S', 'M', 'L', 'XL', 'XXL')"),
  fit: z
    .enum(["", ...FIT_VALUES])
    .optional()
    .default("")
    .describe(
      "Filter by fit style ('slim', 'regular', 'relaxed')",
    ),
  pattern: z
    .enum(["", ...PATTERN_VALUES])
    .optional()
    .default("")
    .describe(
      "Filter by pattern ('solid', 'printed', 'striped', 'checked')",
    ),
  minPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Minimum price in INR ₹ (e.g., 500)"),
  maxPrice: z
    .number()
    .optional()
    .default(0)
    .describe("Maximum price in INR ₹ (e.g., 2500). Use 0 for no maximum."),
});

export const searchProductsTool = tool({
  description:
    "Search Kumar Collection men's ethnic wear. Can search by name, description, or category, and filter by fabric, color, gender, size, fit, pattern, and price range in INR (₹). Returns product details including stock availability.",
  inputSchema: productSearchSchema,
  execute: async ({
    query,
    category,
    fabric,
    color,
    gender,
    size,
    fit,
    pattern,
    minPrice,
    maxPrice,
  }) => {
    console.log("[SearchProducts] Query received:", {
      query,
      category,
      fabric,
      color,
      gender,
      size,
      fit,
      pattern,
      minPrice,
      maxPrice,
    });

    try {
      const { data: products } = await sanityFetch({
        query: AI_SEARCH_PRODUCTS_QUERY,
        params: {
          searchQuery: query || "",
          categorySlug: category || "",
          fabric: fabric || "",
          color: color || "",
          gender: gender || "",
          size: size || "",
          fit: fit || "",
          pattern: pattern || "",
          minPrice: minPrice || 0,
          maxPrice: maxPrice || 0,
        },
      });

      console.log("[SearchProducts] Products found:", products?.length ?? 0);

      if (!products || products.length === 0) {
        return {
          found: false,
          message:
            "No men's ethnic wear found matching your criteria. Try different search terms or filters.",
          products: [],
          filters: {
            query,
            category,
            fabric,
            color,
            gender,
            size,
            fit,
            pattern,
            minPrice,
            maxPrice,
          },
        };
      }

      // Format the results with stock status and clothing attributes for AI
      const formattedProducts: SearchProduct[] = (
        products as AI_SEARCH_PRODUCTS_QUERYResult
      ).map((product) => ({
        id: product._id,
        name: product.name ?? null,
        slug: product.slug ?? null,
        description: product.description ?? null,
        price: product.price ?? null,
        priceFormatted: product.price ? formatPrice(product.price) : null,
        category: product.category?.title ?? null,
        categorySlug: product.category?.slug ?? null,
        fabric: product.fabric ?? null,
        color: Array.isArray(product.colors)
          ? product.colors.map(formatColorName).join(", ")
          : null,
        gender: product.gender ?? null,
        size: Array.isArray(product.size) ? product.size : null,
        fit: product.fit ?? null,
        pattern: product.pattern ?? null,
        stockCount: product.stock ?? 0,
        stockStatus: getStockStatus(product.stock),
        stockMessage: getStockMessage(product.stock),
        featured: product.featured ?? false,
        imageUrl: product.image?.asset?.url ?? null,
        productUrl: product.slug ? `/products/${product.slug}` : null,
      }));

      return {
        found: true,
        message: `Found ${products.length} product${products.length === 1 ? "" : "s"} matching your search.`,
        totalResults: products.length,
        products: formattedProducts,
        filters: {
          query,
          category,
          fabric,
          color,
          gender,
          size,
          fit,
          pattern,
          minPrice,
          maxPrice,
        },
      };
    } catch (error) {
      console.error("[SearchProducts] Error:", error);
      return {
        found: false,
        message: "An error occurred while searching for products.",
        products: [],
        error: error instanceof Error ? error.message : "Unknown error",
        filters: {
          query,
          category,
          fabric,
          color,
          gender,
          size,
          fit,
          pattern,
          minPrice,
          maxPrice,
        },
      };
    }
  },
});



