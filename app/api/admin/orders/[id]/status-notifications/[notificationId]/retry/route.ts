import { NextResponse } from "next/server";
import { deliverOrderStatusNotification } from "@/lib/actions/order-status-notifications";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSanityClient } from "@/lib/sanity/admin-client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; notificationId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const client = getAdminSanityClient();

  const { id, notificationId } = await params;
  const notification = await client.fetch(
    `*[_type == "orderStatusNotification" && _id == $notificationId][0]{_id, "orderId": order->_id, deliveryStatus}`,
    { notificationId },
    { perspective: "raw" },
  );
  if (!notification || notification.orderId !== id) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }
  if (notification.deliveryStatus === "sent") {
    return NextResponse.json({ emailStatus: "sent" });
  }
  if (notification.deliveryStatus === "unknown") {
    return NextResponse.json({ emailStatus: "unknown" }, { status: 409 });
  }

  try {
    const emailStatus = await deliverOrderStatusNotification(notificationId);
    return NextResponse.json({ emailStatus, notificationId });
  } catch {
    console.error("[ORDER STATUS EMAIL] manual retry failed");
    return NextResponse.json(
      { error: "Could not retry the customer notification" },
      { status: 500 },
    );
  }
}
