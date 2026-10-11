"use client";

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AdminSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AdminSearch({
  placeholder = "Search...",
  value,
  onChange,
  className,
}: AdminSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Debounce hook for search
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook to build GROQ filter for product search
export function useProductSearchFilter(searchQuery: string) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const filter = useMemo(() => {
    const term = debouncedQuery
      .trim()
      .replace(/["\\*]/g, "")
      .slice(0, 100);
    if (!term) return undefined;
    // Search in name - GROQ match operator
    return `name match "*${term}*"`;
  }, [debouncedQuery]);

  return { filter, isSearching: searchQuery !== debouncedQuery };
}

// Hook to build GROQ filter for order search
export function useOrderSearchFilter(searchQuery: string) {
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const filter = useMemo(() => {
    const term = debouncedQuery
      .trim()
      .replace(/["\\*]/g, "")
      .slice(0, 100);
    if (!term) return undefined;
    // Search in orderNumber and email
    return `orderNumber match "*${term}*" || email match "*${term}*"`;
  }, [debouncedQuery]);

  return { filter, isSearching: searchQuery !== debouncedQuery };
}
