import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSanityClient } from "@/lib/sanity/admin-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const client = getAdminSanityClient();
  const { id } = await params;
  const failed = await client.fetch(
    `*[_type == "orderStatusNotification" && order._ref == $orderId && deliveryStatus in ["pending", "failed", "sending", "unknown"]] | order(createdAt desc)[0]{_id, deliveryStatus}`,
    { orderId: id },
    { perspective: "raw" },
  );
  return NextResponse.json({
    notificationId: failed?._id ?? null,
    emailStatus: failed?.deliveryStatus ?? null,
  });
}
