"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getOrCreateStripeCustomer } from "@/lib/actions/customer";
import { PRODUCTS_BY_IDS_QUERY } from "@/lib/sanity/queries/products";
import { client } from "@/sanity/lib/client";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

// Types
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Creates a Stripe Checkout Session from cart items
 * Validates stock and prices against Sanity before creating session
 */
export async function createCheckoutSession(
  items: CartItem[],
): Promise<CheckoutResult> {
  try {
    // 1. Verify user is authenticated
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Please sign in to checkout" };
    }

    // 2. Validate cart is not empty
    if (!items || items.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // 3. Fetch current product data from Sanity to validate prices/stock
    const productIds = items.map((item) => item.productId);
    const products = await client.fetch(PRODUCTS_BY_IDS_QUERY, {
      ids: productIds,
    });

    // 4. Validate each item
    const validationErrors: string[] = [];
    const validatedItems: {
      product: (typeof products)[number];
      quantity: number;
      color?: string;
      size?: string;
    }[] = [];

    for (const item of items) {
      const product = products.find(
        (p: { _id: string }) => p._id === item.productId,
      );

      if (!product) {
        validationErrors.push(`Product "${item.name}" is no longer available`);
        continue;
      }

      if ((product.stock ?? 0) === 0) {
        validationErrors.push(`"${product.name}" is out of stock`);
        continue;
      }

      if (item.quantity > (product.stock ?? 0)) {
        validationErrors.push(
          `Only ${product.stock} of "${product.name}" available`,
        );
        continue;
      }

      const productOptions = product as typeof product & {
        colors?: string[];
        size?: string[];
      };
      if (
        item.color &&
        productOptions.colors?.length &&
        !productOptions.colors.includes(item.color)
      ) {
        validationErrors.push(
          `Color "${item.color}" is no longer available for "${product.name}"`,
        );
        continue;
      }
      if (
        item.size &&
        productOptions.size?.length &&
        !productOptions.size.includes(item.size)
      ) {
        validationErrors.push(
          `Size "${item.size}" is no longer available for "${product.name}"`,
        );
        continue;
      }
      if ((productOptions.colors?.length ?? 0) > 1 && !item.color) {
        validationErrors.push(`Please select a color for "${product.name}"`);
        continue;
      }
      if ((productOptions.size?.length ?? 0) > 0 && !item.size) {
        validationErrors.push(`Please select a size for "${product.name}"`);
        continue;
      }

      validatedItems.push({
        product,
        quantity: item.quantity,
        color: item.color ?? productOptions.colors?.[0],
        size: item.size,
      });
    }

    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join(". ") };
    }

    const quantityByProduct = new Map<string, number>();
    for (const item of validatedItems) {
      quantityByProduct.set(
        item.product._id,
        (quantityByProduct.get(item.product._id) ?? 0) + item.quantity,
      );
    }
    for (const [productId, quantity] of quantityByProduct) {
      const product = validatedItems.find(
        (item) => item.product._id === productId,
      )?.product;
      if (quantity > (product?.stock ?? 0))
        validationErrors.push(
          `Only ${product?.stock ?? 0} of "${product?.name}" available across selected variants`,
        );
    }
    if (validationErrors.length)
      return { success: false, error: validationErrors.join(". ") };

    // 5. Create Stripe line items with validated prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      validatedItems.map(({ product, quantity, color, size }) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name ?? "Product",
            description:
              [color && `Color: ${color}`, size && `Size: ${size}`]
                .filter(Boolean)
                .join(" · ") || undefined,
            images: product.image?.asset?.url ? [product.image.asset.url] : [],
            metadata: {
              productId: product._id,
              color: color ?? "",
              size: size ?? "",
            },
          },
          unit_amount: Math.round((product.price ?? 0) * 100), // Convert to paise
        },
        quantity,
      }));

    // 6. Get or create Stripe customer
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "";
    const userName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || userEmail;

    const { stripeCustomerId, sanityCustomerId } =
      await getOrCreateStripeCustomer(userEmail, userName, userId);

    // 7. Prepare metadata for webhook
    const metadata = {
      clerkUserId: userId,
      userEmail,
      sanityCustomerId,
      productIds: validatedItems.map((i) => i.product._id).join(","),
      quantities: validatedItems.map((i) => i.quantity).join(","),
    };

    // 8. Create Stripe Checkout Session
    // Always send production customers back to the public storefront domain.
    // VERCEL_URL can point to a protected deployment-specific URL.
    const baseUrl =
      process.env.VERCEL_ENV === "production"
        ? process.env.NEXT_PUBLIC_BASE_URL ||
          "https://kumarcollection.vercel.app"
        : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: stripeCustomerId,
      phone_number_collection: {
        enabled: true,
      },
      shipping_address_collection: {
        allowed_countries: [
          "GB", // United Kingdom
          "US", // United States
          "CA", // Canada
          "AU", // Australia
          "NZ", // New Zealand
          "IE", // Ireland
          "DE", // Germany
          "FR", // France
          "ES", // Spain
          "IT", // Italy
          "NL", // Netherlands
          "BE", // Belgium
          "AT", // Austria
          "CH", // Switzerland
          "SE", // Sweden
          "NO", // Norway
          "DK", // Denmark
          "FI", // Finland
          "PT", // Portugal
          "PL", // Poland
          "CZ", // Czech Republic
          "GR", // Greece
          "HU", // Hungary
          "RO", // Romania
          "BG", // Bulgaria
          "HR", // Croatia
          "SI", // Slovenia
          "SK", // Slovakia
          "LT", // Lithuania
          "LV", // Latvia
          "EE", // Estonia
          "LU", // Luxembourg
          "MT", // Malta
          "CY", // Cyprus
          "JP", // Japan
          "SG", // Singapore
          "HK", // Hong Kong
          "KR", // South Korea
          "TW", // Taiwan
          "MY", // Malaysia
          "TH", // Thailand
          "IN", // India
          "AE", // United Arab Emirates
          "SA", // Saudi Arabia
          "IL", // Israel
          "ZA", // South Africa
          "BR", // Brazil
          "MX", // Mexico
          "AR", // Argentina
          "CL", // Chile
          "CO", // Colombia
        ],
      },
      metadata,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    return { success: true, url: session.url ?? undefined };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

/**
 * Retrieves a checkout session by ID (for success page)
 */
export async function getCheckoutSession(sessionId: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    // Verify the session belongs to this user
    if (session.metadata?.clerkUserId !== userId) {
      return { success: false, error: "Session not found" };
    }

    return {
      success: true,
      session: {
        id: session.id,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status,
        shippingAddress: session.customer_details?.address,
        lineItems: session.line_items?.data.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          amount: item.amount_total,
        })),
      },
    };
  } catch (error) {
    console.error("Get session error:", error);
    return { success: false, error: "Could not retrieve order details" };
  }
}
