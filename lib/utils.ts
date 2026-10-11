import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { COLORS } from "@/lib/constants/filters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatColorName(value: string | null | undefined): string {
  if (!value) return "";
  return COLORS.find((color) => color.value === value)?.label ?? value;
}

/**
 * Format a price amount with Indian currency symbol and numbering
 * @param amount - The price amount (can be null/undefined)
 * @param currency - Currency symbol (default: "₹")
 * @returns Formatted price string (e.g., "₹1,499" or "₹1,499.50")
 */
export function formatPrice(
  amount: number | null | undefined,
  currency = "₹",
): string {
  const val = amount ?? 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
  return `${currency}${formatted}`;
}

type DateFormatOption = "short" | "long" | "datetime";

const DATE_FORMAT_OPTIONS: Record<
  DateFormatOption,
  Intl.DateTimeFormatOptions
> = {
  short: { day: "numeric", month: "short" },
  long: { day: "numeric", month: "long", year: "numeric" },
  datetime: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

/**
 * Format a date string with locale-specific formatting
 * @param date - ISO date string (can be null/undefined)
 * @param format - Format option: "short" (5 Jan), "long" (5 January 2025), "datetime" (5 January 2025, 14:30)
 * @param fallback - Fallback text when date is null/undefined
 * @returns Formatted date string
 */
export function formatDate(
  date: string | null | undefined,
  format: DateFormatOption = "long",
  fallback = "Date unknown",
): string {
  if (!date) return fallback;
  return new Date(date).toLocaleDateString(
    "en-IN",
    DATE_FORMAT_OPTIONS[format],
  );
}

/**
 * Format an order number for display (shows only the last segment after the last hyphen)
 * @param orderNumber - Full order number (e.g., "ORD-2024-ABC123")
 * @returns Shortened order number (e.g., "ABC123") or "N/A" if null
 */
export function formatOrderNumber(
  orderNumber: string | null | undefined,
): string {
  if (!orderNumber) return "N/A";
  return orderNumber.split("-").pop() ?? orderNumber;
}
