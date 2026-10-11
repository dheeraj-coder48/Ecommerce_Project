import { getOrderStatus } from "@/lib/constants/orderStatus";
import { sendFulfillmentStatusEmail } from "@/lib/email/order-confirmation";
import { getAdminSanityClient } from "@/lib/sanity/admin-client";

const CLAIM_LEASE_MS = 2 * 60 * 1000;

type NotificationResult = "sent" | "failed" | "sending" | "unknown";

export async function deliverOrderStatusNotification(
  notificationId: string,
): Promise<NotificationResult> {
  const client = getAdminSanityClient();
  const notification = await client.fetch(
    `*[_type == "orderStatusNotification" && _id == $notificationId][0]{_id, _rev, order->{_id, orderNumber, email, address, items[]{quantity, "name": product->name}}, fromStatus, toStatus, deliveryStatus, attemptCount, lastAttemptAt}`,
    { notificationId },
    { perspective: "raw" },
  );
  if (!notification) throw new Error("Notification record not found");
  if (notification.deliveryStatus === "sent") return "sent";

  const previousAttempt = Date.parse(notification.lastAttemptAt ?? "");
  if (
    notification.deliveryStatus === "sending" &&
    Number.isFinite(previousAttempt) &&
    Date.now() - previousAttempt < CLAIM_LEASE_MS
  ) {
    return "sending";
  }
  if (notification.deliveryStatus === "sending") {
    await client
      .patch(notificationId)
      .ifRevisionId(notification._rev)
      .set({
        deliveryStatus: "unknown",
        lastErrorCode: "delivery_outcome_unknown",
      })
      .commit();
    return "unknown";
  }

  let claimRevision: string;
  try {
    const claimed = await client
      .patch(notificationId)
      .ifRevisionId(notification._rev)
      .set({
        deliveryStatus: "sending",
        attemptCount: (notification.attemptCount ?? 0) + 1,
        lastAttemptAt: new Date().toISOString(),
        lastErrorCode: null,
      })
      .commit();
    claimRevision = claimed._rev;
  } catch {
    return "sending";
  }

  const order = notification.order;
  if (!order || typeof order.email !== "string" || !order.email.trim()) {
    await recordFailure(notificationId, claimRevision, "missing_recipient");
    return "failed";
  }

  const siteUrl = process.env.SITE_URL;
  const requiredSettings = [
    "SITE_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM_EMAIL",
  ];
  const missingSettings = requiredSettings.filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missingSettings.length || !siteUrl) {
    await recordFailure(
      notificationId,
      claimRevision,
      `configuration_missing_${missingSettings.join("_").toLowerCase()}`,
    );
    return "failed";
  }

  try {
    await sendFulfillmentStatusEmail({
      recipient: order.email,
      orderNumber: notification.orderNumber ?? order.orderNumber ?? order._id,
      status: getOrderStatus(notification.toStatus).label,
      items: (order.items ?? []).map(
        (item: { name?: string; quantity?: number }) => ({
          name: item.name ?? "Item",
          quantity: item.quantity ?? 1,
        }),
      ),
      address:
        notification.toStatus === "cancelled" ? undefined : order.address,
      orderUrl: `${siteUrl.replace(/\/$/, "")}/orders/${encodeURIComponent(order._id)}`,
    });

    await client
      .patch(notificationId)
      .ifRevisionId(claimRevision)
      .set({
        deliveryStatus: "sent",
        sentAt: new Date().toISOString(),
        lastErrorCode: null,
      })
      .commit();
    return "sent";
  } catch {
    // SMTP errors can happen after the server accepted the message. Mark the
    // result uncertain and require operator review rather than risk resending.
    await markUnknown(notificationId, claimRevision);
    return "unknown";
  }
}

async function markUnknown(notificationId: string, claimRevision: string) {
  try {
    await getAdminSanityClient()
      .patch(notificationId)
      .ifRevisionId(claimRevision)
      .set({
        deliveryStatus: "unknown",
        lastErrorCode: "delivery_outcome_unknown",
      })
      .commit();
  } catch {
    console.error("[ORDER STATUS EMAIL] could not record delivery state");
  }
}

async function recordFailure(
  notificationId: string,
  claimRevision: string,
  errorCode: string,
) {
  try {
    await getAdminSanityClient()
      .patch(notificationId)
      .ifRevisionId(claimRevision)
      .set({ deliveryStatus: "failed", lastErrorCode: errorCode })
      .commit();
  } catch {
    console.error("[ORDER STATUS EMAIL] could not record delivery failure");
  }
}
