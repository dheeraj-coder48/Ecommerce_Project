"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type DocumentHandle,
  useDocument,
} from "@/components/admin/admin-sanity";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrderStatus,
  ORDER_STATUS_CONFIG,
  type OrderStatusValue,
} from "@/lib/constants/orderStatus";

interface StatusSelectProps extends DocumentHandle {}

type StatusResponse = {
  error?: string;
  fulfillmentStatus?: string;
  emailStatus?: "sent" | "failed" | "sending" | "unknown" | "unchanged";
  notificationId?: string;
};

function getCurrentFulfillmentStatus(
  fulfillmentStatus: unknown,
  legacyStatus: unknown,
): OrderStatusValue {
  if (
    typeof fulfillmentStatus === "string" &&
    fulfillmentStatus in ORDER_STATUS_CONFIG &&
    fulfillmentStatus !== "paid"
  ) {
    return fulfillmentStatus as OrderStatusValue;
  }
  if (
    typeof legacyStatus === "string" &&
    legacyStatus in ORDER_STATUS_CONFIG &&
    legacyStatus !== "paid"
  ) {
    return legacyStatus as OrderStatusValue;
  }
  return "processing";
}

function StatusSelectContent(handle: StatusSelectProps) {
  const router = useRouter();
  const { data: fulfillmentStatus } = useDocument({
    ...handle,
    path: "fulfillmentStatus",
  });
  const { data: legacyStatus } = useDocument({ ...handle, path: "status" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [retryNotificationId, setRetryNotificationId] = useState<string>();

  useEffect(() => {
    let active = true;
    fetch(
      `/api/admin/orders/${encodeURIComponent(handle.documentId)}/status-notifications`,
    )
      .then((response) => response.json())
      .then(
        (result: { notificationId?: string | null; emailStatus?: string }) => {
          if (active && result.notificationId) {
            setRetryNotificationId(result.notificationId);
            setMessage(
              result.emailStatus === "unknown"
                ? "Email delivery could not be confirmed. Check the mail provider before retrying."
                : "A customer notification needs attention.",
            );
            setMessageIsError(true);
          }
        },
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [handle.documentId]);

  const currentStatus = getCurrentFulfillmentStatus(
    fulfillmentStatus,
    legacyStatus,
  );
  const statusConfig = getOrderStatus(currentStatus);
  const StatusIcon = statusConfig.icon;

  const updateStatus = async (value: string) => {
    setBusy(true);
    setMessage("");
    setRetryNotificationId(undefined);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(handle.documentId)}/fulfillment-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: value,
            expectedStatus: currentStatus,
          }),
        },
      );
      const result = (await response.json()) as StatusResponse;
      if (!response.ok)
        throw new Error(result.error ?? "Could not update status");

      if (result.emailStatus === "failed" && result.notificationId) {
        setRetryNotificationId(result.notificationId);
        setMessage(
          "Status saved, but the customer email failed. Retry it below.",
        );
        setMessageIsError(true);
      } else if (result.emailStatus === "sending") {
        setMessage(
          "Status saved. The customer email is already being processed.",
        );
        setMessageIsError(false);
      } else if (result.emailStatus === "sent") {
        setMessage("Status saved. Email accepted by the mail server.");
        setMessageIsError(false);
      } else if (result.emailStatus === "unknown") {
        setMessage(
          "Status saved. Email delivery could not be confirmed; check before retrying.",
        );
        setMessageIsError(true);
      } else {
        setMessage("Status saved. No duplicate email was sent.");
        setMessageIsError(false);
      }
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update status",
      );
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  };

  const retryEmail = async () => {
    if (!retryNotificationId) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(handle.documentId)}/status-notifications/${encodeURIComponent(retryNotificationId)}/retry`,
        { method: "POST" },
      );
      const result = (await response.json()) as StatusResponse;
      if (!response.ok)
        throw new Error(result.error ?? "Could not retry email");
      if (result.emailStatus === "sent") {
        setMessage("Customer notification sent.");
        setRetryNotificationId(undefined);
        setMessageIsError(false);
      } else if (result.emailStatus === "failed") {
        setMessage("The notification retry failed. You can try again.");
        setMessageIsError(true);
      } else if (result.emailStatus === "unknown") {
        setMessage(
          "Delivery could not be confirmed. Check the mail provider before retrying.",
        );
        setRetryNotificationId(undefined);
        setMessageIsError(true);
      } else {
        setMessage("The notification is already being processed.");
        setMessageIsError(false);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not retry email",
      );
      setMessageIsError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select
        value={currentStatus}
        onValueChange={updateStatus}
        disabled={busy}
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ORDER_STATUS_CONFIG)
            .filter(([value]) => value !== "paid")
            .map(([value, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
        </SelectContent>
      </Select>
      {message && (
        <output className="block max-w-xs text-xs" aria-live="polite">
          <p className={messageIsError ? "text-red-700" : "text-green-700"}>
            {message}
          </p>
          {retryNotificationId &&
            !message.toLowerCase().includes("could not be confirmed") && (
              <button
                type="button"
                onClick={retryEmail}
                disabled={busy}
                className="mt-1 font-medium underline underline-offset-2 disabled:opacity-50"
              >
                Retry customer email
              </button>
            )}
        </output>
      )}
    </div>
  );
}

export function StatusSelect(props: StatusSelectProps) {
  return <StatusSelectContent {...props} />;
}
