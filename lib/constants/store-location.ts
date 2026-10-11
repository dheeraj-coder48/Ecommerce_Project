/** Configure these public values when the physical store address is confirmed. */
export const STORE_ADDRESS =
  process.env.NEXT_PUBLIC_STORE_ADDRESS?.trim() ?? "";
export const STORE_MAP_EMBED_URL =
  process.env.NEXT_PUBLIC_STORE_MAP_EMBED_URL?.trim() ?? "";
export const STORE_DIRECTIONS_URL =
  process.env.NEXT_PUBLIC_STORE_DIRECTIONS_URL?.trim() ||
  (STORE_ADDRESS
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE_ADDRESS)}`
    : "");
export const STORE_MAP_URL =
  STORE_MAP_EMBED_URL ||
  (STORE_ADDRESS
    ? `https://www.google.com/maps?q=${encodeURIComponent(STORE_ADDRESS)}&output=embed`
    : "");
