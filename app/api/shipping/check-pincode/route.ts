import { checkShiprocketDelivery } from "@/lib/shiprocket";

const REQUEST_WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const requestWindows = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(request: Request) {
  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const now = Date.now();
  const current = requestWindows.get(address);

  if (!current || current.expiresAt <= now) {
    requestWindows.set(address, {
      count: 1,
      expiresAt: now + REQUEST_WINDOW_MS,
    });
  } else if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  } else {
    current.count += 1;
  }

  if (requestWindows.size > 500) {
    for (const [key, value] of requestWindows) {
      if (value.expiresAt <= now) requestWindows.delete(key);
    }
    while (requestWindows.size > 500) {
      const oldestAddress = requestWindows.keys().next().value;
      if (!oldestAddress) break;
      requestWindows.delete(oldestAddress);
    }
  }

  return false;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return Response.json(
      { error: "Too many checks. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const pincode =
    typeof body === "object" && body !== null && "pincode" in body
      ? body.pincode
      : null;
  if (typeof pincode !== "string" || !/^\d{6}$/.test(pincode)) {
    return Response.json(
      { error: "Please enter a valid 6-digit pincode." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await checkShiprocketDelivery(pincode));
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";
    console.error("Shiprocket delivery check failed:", reason);
    return Response.json(
      { error: "We couldn't check delivery right now. Please try again." },
      { status: 503 },
    );
  }
}
