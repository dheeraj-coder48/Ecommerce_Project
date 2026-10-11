import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { deliverOrderStatusNotification } from "@/lib/actions/order-status-notifications";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSanityClient } from "@/lib/sanity/admin-client";

const fulfillmentStatuses = [
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type FulfillmentStatus = (typeof fulfillmentStatuses)[number];

const transitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  processing: ["shipped", "cancelled"],
  shipped: ["processing", "out_for_delivery", "delivered"],
  out_for_delivery: ["processing", "shipped", "delivered"],
  delivered: [],
  cancelled: [],
};

const statusLabels: Record<FulfillmentStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function normalizeStatus(fulfillmentStatus: unknown, legacyStatus: unknown) {
  if (
    typeof fulfillmentStatus === "string" &&
    fulfillmentStatuses.includes(fulfillmentStatus as FulfillmentStatus)
  ) {
    return fulfillmentStatus as FulfillmentStatus;
  }
  if (
    typeof legacyStatus === "string" &&
    fulfillmentStatuses.includes(legacyStatus as FulfillmentStatus)
  ) {
    return legacyStatus as FulfillmentStatus;
  }
  return "processing" as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const client = getAdminSanityClient();

  let body: { status?: unknown; expectedStatus?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (
    typeof body.status !== "string" ||
    !fulfillmentStatuses.includes(body.status as FulfillmentStatus) ||
    typeof body.expectedStatus !== "string" ||
    !fulfillmentStatuses.includes(body.expectedStatus as FulfillmentStatus)
  ) {
    return NextResponse.json(
      { error: "Invalid fulfillment status" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const nextStatus = body.status as FulfillmentStatus;
  const order = await client.fetch(
    `*[_type == "order" && _id == $id][0]{_id, _rev, orderNumber, status, paymentStatus, fulfillmentStatus}`,
    { id },
  );
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.paymentStatus && order.paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Fulfillment can only be updated for paid orders" },
      { status: 409 },
    );
  }

  const currentStatus = normalizeStatus(order.fulfillmentStatus, order.status);
  if (currentStatus !== body.expectedStatus) {
    return NextResponse.json(
      { error: "Order status changed. Refresh and try again." },
      { status: 409 },
    );
  }

  if (currentStatus === nextStatus) {
    return NextResponse.json({
      fulfillmentStatus: currentStatus,
      emailStatus: "unchanged",
    });
  }

  if (!transitions[currentStatus].includes(nextStatus)) {
    return NextResponse.json(
      {
        error: `Cannot move an order from ${statusLabels[currentStatus]} to ${statusLabels[nextStatus]}`,
      },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  const transitionKey = `${order._id}:${order._rev}:${nextStatus}`;
  const notificationId = `orderStatusEmail.${createHash("sha256").update(transitionKey).digest("hex")}`;

  try {
    await client
      .transaction()
      .patch(order._id, (patch) =>
        patch.ifRevisionId(order._rev).set({
          fulfillmentStatus: nextStatus,
          fulfillmentUpdatedAt: now,
          // Keep the existing status field synchronized for older order views and reports.
          status: nextStatus,
        }),
      )
      .create({
        _id: notificationId,
        _type: "orderStatusNotification",
        order: { _type: "reference", _ref: order._id },
        orderNumber: order.orderNumber ?? order._id,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        deliveryStatus: "pending",
        attemptCount: 0,
        createdAt: now,
      })
      .commit();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 409
    ) {
      return NextResponse.json(
        { error: "Order status changed. Refresh and try again." },
        { status: 409 },
      );
    }
    console.error("[ADMIN ORDER] status transaction failed");
    return NextResponse.json(
      { error: "Could not save the order status. Try again." },
      { status: 500 },
    );
  }

  let emailStatus: "sent" | "failed" | "sending" | "unknown" = "failed";
  try {
    emailStatus = await deliverOrderStatusNotification(notificationId);
  } catch {
    // The status and notification outbox record are already saved atomically.
    console.error("[ORDER STATUS EMAIL] notification processing failed");
  }

  return NextResponse.json({
    fulfillmentStatus: nextStatus,
    emailStatus,
    notificationId,
  });
}
