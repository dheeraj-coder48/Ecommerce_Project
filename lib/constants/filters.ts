// ============================================
// Clothing & Fashion Attribute Constants
// Shared between frontend filters and Sanity schema
// ============================================

export const COLORS = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "navy", label: "Navy Blue" },
  { value: "grey", label: "Grey" },
  { value: "beige", label: "Beige" },
  { value: "brown", label: "Brown" },
  { value: "olive", label: "Olive Green" },
  { value: "burgundy", label: "Burgundy" },
  { value: "blue", label: "Sky Blue" },
  { value: "red", label: "Crimson Red" },
  { value: "green", label: "Emerald Green" },
  { value: "pink", label: "Blush Pink" },
  { value: "yellow", label: "Mustard Yellow" },
  { value: "orange", label: "Orange" },
] as const;

export const FABRICS = [
  { value: "cotton", label: "Cotton" },
  { value: "linen", label: "Linen" },
  { value: "polyester", label: "Polyester" },
  { value: "wool", label: "Wool Blend" },
  { value: "silk", label: "Mulberry Silk" },
  { value: "rayon", label: "Rayon" },
  { value: "velvet", label: "Velvet" },
  { value: "knit", label: "Ribbed Knit" },
] as const;

export const SIZES = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
] as const;

export const FITS = [
  { value: "slim", label: "Slim Fit" },
  { value: "regular", label: "Regular Fit" },
  { value: "relaxed", label: "Relaxed Fit" },
] as const;

export const PATTERNS = [
  { value: "solid", label: "Solid Plain" },
  { value: "printed", label: "Printed" },
  { value: "striped", label: "Striped" },
  { value: "checked", label: "Checked / Plaid" },
] as const;

export const GENDERS = [
  { value: "men", label: "Men" },
] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevance", label: "Relevance" },
] as const;

// Type exports
export type ColorValue = (typeof COLORS)[number]["value"];
export type FabricValue = (typeof FABRICS)[number]["value"];
export type SizeValue = (typeof SIZES)[number]["value"];
export type FitValue = (typeof FITS)[number]["value"];
export type PatternValue = (typeof PATTERNS)[number]["value"];
export type GenderValue = (typeof GENDERS)[number]["value"];
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ============================================
// Sanity Schema Format Exports
// Format compatible with Sanity's options.list
// ============================================

export const COLORS_SANITY_LIST = COLORS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const FABRICS_SANITY_LIST = FABRICS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const SIZES_SANITY_LIST = SIZES.map(({ value, label }) => ({
  title: label,
  value,
}));

export const FITS_SANITY_LIST = FITS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const PATTERNS_SANITY_LIST = PATTERNS.map(({ value, label }) => ({
  title: label,
  value,
}));

export const GENDERS_SANITY_LIST = GENDERS.map(({ value, label }) => ({
  title: label,
  value,
}));

/** Values arrays for zod enums or validation */
export const COLOR_VALUES = COLORS.map((c) => c.value) as [
  ColorValue,
  ...ColorValue[],
];

export const FABRIC_VALUES = FABRICS.map((f) => f.value) as [
  FabricValue,
  ...FabricValue[],
];

export const SIZE_VALUES = SIZES.map((s) => s.value) as [
  SizeValue,
  ...SizeValue[],
];

export const FIT_VALUES = FITS.map((f) => f.value) as [FitValue, ...FitValue[]];

export const PATTERN_VALUES = PATTERNS.map((p) => p.value) as [
  PatternValue,
  ...PatternValue[],
];

export const GENDER_VALUES = GENDERS.map((g) => g.value) as [
  GenderValue,
  ...GenderValue[],
];

