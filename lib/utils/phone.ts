/**
 * Validates and normalizes an Indian mobile number to +91XXXXXXXXXX.
 * Accepts a 10-digit number or the same number prefixed by +91, with
 * optional spaces and hyphens between digits.
 */
export function normalizeIndianMobilePhone(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  const compactPhone = phone.replace(/[\s-]/g, "");
  const match = /^(?:\+91)?([6-9]\d{9})$/.exec(compactPhone);

  return match ? `+91${match[1]}` : null;
}
