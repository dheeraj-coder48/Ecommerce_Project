import "server-only";

const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_SAFETY_WINDOW_MS = 60_000;
const SERVICEABILITY_CACHE_TTL_MS = 10 * 60_000;
const REQUEST_TIMEOUT_MS = 8_000;

interface ShiprocketTokenResponse {
  token?: unknown;
}

interface ShiprocketCourier {
  courier_name?: unknown;
  etd?: unknown;
  etd_hours?: unknown;
  estimated_delivery_days?: unknown;
}

interface ShiprocketServiceabilityResponse {
  status?: unknown;
  data?: {
    available_courier_companies?: unknown;
  };
}

export interface DeliveryCheckResult {
  available: boolean;
  estimate: string | null;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface CachedDeliveryResult {
  result: DeliveryCheckResult;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let tokenRequest: Promise<CachedToken> | null = null;
const deliveryCache = new Map<string, CachedDeliveryResult>();

function readConfiguration() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE;
  const weight = Number(process.env.SHIPROCKET_SERVICEABILITY_WEIGHT_KG);

  if (
    !email ||
    !password ||
    !pickupPostcode ||
    !/^\d{6}$/.test(pickupPostcode) ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    throw new Error("Shiprocket configuration is incomplete");
  }

  return { email, password, pickupPostcode, weight };
}

function tokenExpiry(token: string) {
  try {
    const payload = token.split(".")[1];
    if (payload) {
      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
      if (typeof decoded.exp === "number") {
        return Math.max(0, decoded.exp * 1_000 - TOKEN_SAFETY_WINDOW_MS);
      }
    }
  } catch {
    // Use a short cache when Shiprocket returns a token without a readable JWT expiry.
  }

  return Date.now() + 10 * 60_000;
}

async function authenticate(forceRefresh = false): Promise<string> {
  if (forceRefresh) cachedToken = null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  if (tokenRequest) return (await tokenRequest).value;

  tokenRequest = (async () => {
    const { email, password } = readConfiguration();
    const response = await fetch(`${SHIPROCKET_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error("Shiprocket authentication failed");
    const payload = (await response.json()) as ShiprocketTokenResponse;
    if (typeof payload.token !== "string" || !payload.token) {
      throw new Error("Shiprocket authentication returned no token");
    }

    const token = {
      value: payload.token,
      expiresAt: tokenExpiry(payload.token),
    };
    cachedToken = token;
    return token;
  })();

  try {
    return (await tokenRequest).value;
  } finally {
    tokenRequest = null;
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function customerEstimate(couriers: ShiprocketCourier[]) {
  const candidates = couriers
    .map((courier) => {
      const dayValues =
        typeof courier.estimated_delivery_days === "string" ||
        typeof courier.estimated_delivery_days === "number"
          ? String(courier.estimated_delivery_days).match(/\d+(?:\.\d+)?/g)
          : null;
      const durationDays = dayValues?.length
        ? Number(dayValues[0])
        : typeof courier.etd_hours === "number" && courier.etd_hours > 0
          ? courier.etd_hours / 24
          : Number.POSITIVE_INFINITY;

      return { courier, durationDays };
    })
    .sort((a, b) => a.durationDays - b.durationDays);

  const selected = candidates[0]?.courier;
  if (!selected) return null;

  if (typeof selected.etd === "string" && selected.etd.trim()) {
    const dates = selected.etd
      .split(/\s+-\s+/)
      .map((part) => new Date(part.trim()))
      .filter((date) => Number.isFinite(date.getTime()));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dates.length && dates.every((date) => date >= today)) {
      const estimate = dates.map(formatDate);
      return estimate.length > 1 && estimate[0] !== estimate[1]
        ? `Estimated delivery ${estimate[0]}–${estimate[1]}`
        : `Estimated delivery by ${estimate[0]}`;
    }
  }

  if (Number.isFinite(candidates[0].durationDays)) {
    const values =
      typeof selected.estimated_delivery_days === "string" ||
      typeof selected.estimated_delivery_days === "number"
        ? String(selected.estimated_delivery_days).match(/\d+(?:\.\d+)?/g)
        : null;
    if (values?.length) {
      return values.length > 1
        ? `Estimated delivery in ${values[0]}–${values[1]} days`
        : `Estimated delivery in ${values[0]} days`;
    }
    return `Estimated delivery in ${Math.ceil(candidates[0].durationDays)} days`;
  }

  return null;
}

async function requestServiceability(
  token: string,
  pickupPostcode: string,
  deliveryPostcode: string,
  weight: number,
) {
  const url = new URL(`${SHIPROCKET_API}/courier/serviceability/`);
  url.searchParams.set("pickup_postcode", pickupPostcode);
  url.searchParams.set("delivery_postcode", deliveryPostcode);
  url.searchParams.set("cod", "0");
  url.searchParams.set("weight", String(weight));

  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function checkShiprocketDelivery(
  deliveryPostcode: string,
): Promise<DeliveryCheckResult> {
  if (!/^\d{6}$/.test(deliveryPostcode)) {
    throw new Error("Invalid delivery pincode");
  }

  const { pickupPostcode, weight } = readConfiguration();
  const cacheKey = `${pickupPostcode}:${deliveryPostcode}:${weight}`;
  const cached = deliveryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  let token = await authenticate();
  let response = await requestServiceability(
    token,
    pickupPostcode,
    deliveryPostcode,
    weight,
  );
  if (response.status === 401 || response.status === 403) {
    token = await authenticate(true);
    response = await requestServiceability(
      token,
      pickupPostcode,
      deliveryPostcode,
      weight,
    );
  }

  if (!response.ok) throw new Error("Shiprocket serviceability request failed");
  const payload = (await response.json()) as ShiprocketServiceabilityResponse;
  if (
    payload.status !== undefined &&
    payload.status !== 200 &&
    payload.status !== "200"
  ) {
    throw new Error(
      "Shiprocket returned an unsuccessful serviceability result",
    );
  }

  const rawCouriers = payload.data?.available_courier_companies;
  if (!Array.isArray(rawCouriers)) {
    throw new Error(
      "Shiprocket returned an unexpected serviceability response",
    );
  }

  const couriers = rawCouriers.filter(
    (courier): courier is ShiprocketCourier =>
      typeof courier === "object" &&
      courier !== null &&
      typeof courier.courier_name === "string" &&
      courier.courier_name.length > 0,
  );
  const result: DeliveryCheckResult = {
    available: couriers.length > 0,
    estimate: couriers.length ? customerEstimate(couriers) : null,
  };

  const now = Date.now();
  for (const [key, value] of deliveryCache) {
    if (value.expiresAt <= now) deliveryCache.delete(key);
  }
  if (deliveryCache.size >= 500) {
    const oldestKey = deliveryCache.keys().next().value;
    if (oldestKey) deliveryCache.delete(oldestKey);
  }
  deliveryCache.set(cacheKey, {
    result,
    expiresAt: now + SERVICEABILITY_CACHE_TTL_MS,
  });

  return result;
}
