export const STORE_NAME = "Kumar Collection";
export const STORE_PHONE = "7208239987";

/** Override with NEXT_PUBLIC_TRACK_ORDER_URL when the tracking provider changes. */
export const TRACK_ORDER_URL =
  process.env.NEXT_PUBLIC_TRACK_ORDER_URL?.trim() ||
  "https://trackcourier.io/delhivery-courier-tracking";
