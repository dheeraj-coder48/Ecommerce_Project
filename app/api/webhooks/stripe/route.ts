import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { ORDER_BY_STRIPE_PAYMENT_ID_QUERY } from "@/lib/sanity/queries/orders";
import { normalizeIndianMobilePhone } from "@/lib/utils/phone";
import { client, writeClient } from "@/sanity/lib/client";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const EMAIL_CLAIM_LEASE_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[STRIPE WEBHOOK] signature header missing; returning 400");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(
      "[STRIPE WEBHOOK] signature verification failed:",
      message,
      "returning 400",
    );
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  console.info("[STRIPE WEBHOOK] event received");
  console.info(`[STRIPE WEBHOOK] event type: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.info(
        `[STRIPE WEBHOOK] session ID present: ${Boolean(session.id)}`,
      );
      console.info(
        `[STRIPE WEBHOOK] clerk user ID present: ${Boolean(session.metadata?.clerkUserId)}`,
      );

      try {
        await handleCheckoutCompleted(session);
      } catch (error) {
        console.error(
          "[STRIPE WEBHOOK] checkout.session.completed processing failed:",
          error instanceof Error ? error.message : "Unknown error",
          "returning 500",
        );
        return NextResponse.json(
          { error: "Webhook processing failed" },
          { status: 500 },
        );
      }
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  console.info("[STRIPE WEBHOOK] returning 200");
  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const stripePaymentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  try {
    if (session.payment_status !== "paid") {
      console.info(
        "[STRIPE WEBHOOK] session payment is not complete; skipping order creation",
      );
      return;
    }

    if (!stripePaymentId) {
      throw new Error("Checkout session is missing its payment intent ID");
    }

    // Idempotency check: prevent duplicate processing on webhook retries
    const existingOrder = await client.fetch(ORDER_BY_STRIPE_PAYMENT_ID_QUERY, {
      stripePaymentId,
    });

    console.info(
      `[STRIPE WEBHOOK] existing order found: ${Boolean(existingOrder)}`,
    );

    if (existingOrder) {
      await sendConfirmationOnce(
        existingOrder._id,
        stripePaymentId,
        session.total_details?.amount_shipping ?? 0,
      );
      return;
    }

    const customerPhone = normalizeIndianMobilePhone(
      session.customer_details?.phone,
    );
    if (!customerPhone) {
      throw new Error(
        "Checkout session is missing a valid Indian mobile number; order was not created",
      );
    }

    // Extract metadata
    const {
      clerkUserId,
      userEmail,
      sanityCustomerId,
      productIds: productIdsString,
      quantities: quantitiesString,
    } = session.metadata ?? {};

    if (!clerkUserId || !productIdsString || !quantitiesString) {
      throw new Error(
        "Checkout session is missing required order metadata (Clerk user, products, or quantities)",
      );
    }

    const productIds = productIdsString.split(",");
    const quantities = quantitiesString.split(",").map(Number);

    // Product metadata carries the exact selected variant through Stripe.
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });
    const orderItems = lineItems.data.map((lineItem, index) => {
      const stripeProduct = lineItem.price?.product;
      const variantMetadata =
        typeof stripeProduct === "object" && "metadata" in stripeProduct
          ? stripeProduct.metadata
          : {};
      const productId = variantMetadata.productId ?? productIds[index];
      return {
        _key: `item-${index}`,
        product: { _type: "reference" as const, _ref: productId },
        quantity: lineItem.quantity ?? quantities[index] ?? 1,
        priceAtPurchase:
          (lineItem.amount_total ?? 0) / 100 / (lineItem.quantity ?? 1),
        color: variantMetadata.color || undefined,
        size: variantMetadata.size || undefined,
      };
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Extract shipping address
    const shippingAddress = session.customer_details?.address;
    const address = shippingAddress
      ? {
          name: session.customer_details?.name ?? "",
          line1: shippingAddress.line1 ?? "",
          line2: shippingAddress.line2 ?? "",
          city: shippingAddress.city ?? "",
          postcode: shippingAddress.postal_code ?? "",
          country: shippingAddress.country ?? "",
        }
      : undefined;

    // Create order in Sanity with customer reference
    console.info("[STRIPE WEBHOOK] Sanity order creation started");
    const order = await writeClient.create({
      _type: "order",
      orderNumber,
      ...(sanityCustomerId && {
        customer: {
          _type: "reference",
          _ref: sanityCustomerId,
        },
      }),
      clerkUserId,
      email: userEmail ?? session.customer_details?.email ?? "",
      customerPhone,
      items: orderItems,
      total: (session.amount_total ?? 0) / 100,
      status: "paid",
      paymentStatus: "paid",
      fulfillmentStatus: "processing",
      stripePaymentId,
      address,
      createdAt: new Date().toISOString(),
    });

    console.info("[STRIPE WEBHOOK] Sanity order creation succeeded");

    // Decrease stock for all products in a single transaction
    const stockByProduct = orderItems.reduce<Record<string, number>>(
      (totals, item) => {
        const productId = item.product._ref;
        totals[productId] = (totals[productId] ?? 0) + item.quantity;
        return totals;
      },
      {},
    );
    await Object.entries(stockByProduct)
      .reduce(
        (tx, [productId, quantity]) =>
          tx.patch(productId, (p) => p.dec({ stock: quantity })),
        writeClient.transaction(),
      )
      .commit();

    await sendConfirmationOnce(
      order._id,
      stripePaymentId,
      session.total_details?.amount_shipping ?? 0,
    );

    console.log(
      `Stock updated for ${Object.keys(stockByProduct).length} products`,
    );
  } catch (error) {
    console.error(
      "[STRIPE WEBHOOK] order processing error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error; // Re-throw to return 500 and trigger Stripe retry
  }
}

async function sendConfirmationOnce(
  orderId: string,
  stripePaymentId: string,
  shippingCents: number,
) {
  const order = await client.fetch(
    `*[_type == "order" && _id == $orderId][0]{_id, orderNumber, email, createdAt, total, address, items[]{quantity, priceAtPurchase, color, size, "name": product->name, "image": product->images[0].asset->url}}`,
    { orderId },
  );

  if (!order || typeof order.email !== "string" || !order.email.trim()) {
    console.info("[ORDER EMAIL] skipped: customer email unavailable");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) {
    console.info("[ORDER EMAIL] skipped: customer email is invalid");
    return;
  }

  const siteUrl = process.env.SITE_URL;
  const smtpReady = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM_EMAIL,
  );
  if (!siteUrl || !smtpReady) {
    throw new Error("Order confirmation email configuration unavailable");
  }
  try {
    const parsedSiteUrl = new URL(siteUrl);
    if (!["http:", "https:"].includes(parsedSiteUrl.protocol))
      throw new Error();
  } catch {
    throw new Error("Order confirmation site URL is invalid");
  }

  const markerId = `emailConfirmation.${stripePaymentId}`;
  const acquired = await acquireEmailClaim(markerId, orderId);
  if (acquired === "sent") return;
  if (acquired === "inProgress") {
    throw new Error("Order confirmation delivery is already in progress");
  }

  const items: {
    name: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    size?: string;
    color?: string;
  }[] = (order.items ?? []).map(
    (item: {
      name?: string;
      image?: string;
      quantity?: number;
      priceAtPurchase?: number;
      size?: string;
      color?: string;
    }) => ({
      name: item.name ?? "Item",
      image: item.image,
      quantity: item.quantity ?? 1,
      unitPrice: item.priceAtPurchase ?? 0,
      size: item.size,
      color: item.color,
    }),
  );

  try {
    await sendOrderConfirmationEmail({
      recipient: order.email,
      orderId,
      orderNumber: order.orderNumber ?? orderId,
      orderDate: new Date(order.createdAt ?? Date.now()).toLocaleDateString(
        "en-IN",
        { dateStyle: "long", timeZone: "Asia/Kolkata" },
      ),
      items,
      subtotal: items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
      shipping: shippingCents / 100,
      total: order.total ?? 0,
      address: order.address,
      orderUrl: `${siteUrl.replace(/\/$/, "")}/orders/${encodeURIComponent(orderId)}`,
    });
    try {
      await writeClient
        .patch(markerId)
        .set({ status: "sent", sentAt: new Date().toISOString() })
        .commit();
      console.info("[ORDER EMAIL] confirmation submitted successfully");
    } catch {
      // SMTP accepted the message. Keep the active claim to prevent a duplicate.
      console.error("[ORDER EMAIL] sent marker update failed");
    }
  } catch {
    // Release the claim so Stripe's retry can attempt delivery again.
    try {
      await writeClient
        .patch(markerId)
        .set({ status: "failed", failedAt: new Date().toISOString() })
        .commit();
    } catch {
      console.error("[ORDER EMAIL] failed claim release");
    }
    console.error(
      "[ORDER EMAIL] confirmation submission failed:",
      "SMTP submission error",
    );
    throw new Error("Order confirmation delivery failed");
  }
}

async function acquireEmailClaim(markerId: string, orderId: string) {
  const now = new Date();
  const marker = await client.fetch(
    `*[_id == $markerId][0]{_id, _rev, status, claimedAt, createdAt}`,
    { markerId },
  );

  if (marker?.status === "sent") {
    console.info("[ORDER EMAIL] confirmation already sent; skipping duplicate");
    return "sent" as const;
  }

  if (marker) {
    const lastClaimedAt = Date.parse(
      marker.claimedAt ?? marker.createdAt ?? "",
    );
    if (
      marker.status === "sending" &&
      Number.isFinite(lastClaimedAt) &&
      now.getTime() - lastClaimedAt < EMAIL_CLAIM_LEASE_MS
    ) {
      console.info("[ORDER EMAIL] confirmation is already in progress");
      return "inProgress" as const;
    }

    try {
      await writeClient
        .patch(markerId)
        .ifRevisionId(marker._rev)
        .set({ status: "sending", claimedAt: now.toISOString() })
        .commit();
      return true;
    } catch {
      console.info("[ORDER EMAIL] another delivery attempt owns the claim");
      return "inProgress" as const;
    }
  }

  try {
    await writeClient.create({
      _id: markerId,
      _type: "emailDelivery",
      purpose: "orderConfirmation",
      orderId,
      status: "sending",
      claimedAt: now.toISOString(),
    });
    return "acquired" as const;
  } catch {
    const concurrentClaim = await client.fetch(`*[_id == $markerId][0]{_id}`, {
      markerId,
    });
    if (concurrentClaim) {
      console.info("[ORDER EMAIL] another delivery attempt owns the claim");
      return "inProgress" as const;
    }
    throw new Error("Order confirmation claim unavailable");
  }
}
