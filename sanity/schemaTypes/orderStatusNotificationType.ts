import { defineField, defineType } from "sanity";

export const orderStatusNotificationType = defineType({
  name: "orderStatusNotification",
  title: "Order Status Email",
  type: "document",
  fields: [
    defineField({ name: "order", type: "reference", to: [{ type: "order" }] }),
    defineField({ name: "orderNumber", type: "string" }),
    defineField({ name: "fromStatus", type: "string" }),
    defineField({ name: "toStatus", type: "string" }),
    defineField({
      name: "deliveryStatus",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Sending", value: "sending" },
          { title: "Sent", value: "sent" },
          { title: "Failed", value: "failed" },
          { title: "Delivery outcome unknown", value: "unknown" },
        ],
      },
    }),
    defineField({ name: "attemptCount", type: "number" }),
    defineField({ name: "createdAt", type: "datetime" }),
    defineField({ name: "lastAttemptAt", type: "datetime" }),
    defineField({ name: "sentAt", type: "datetime" }),
    defineField({ name: "lastErrorCode", type: "string" }),
  ],
  preview: {
    select: {
      title: "orderNumber",
      fromStatus: "fromStatus",
      toStatus: "toStatus",
      deliveryStatus: "deliveryStatus",
    },
    prepare({ title, fromStatus, toStatus, deliveryStatus }) {
      return {
        title: `Order ${title ?? ""}: ${fromStatus ?? "?"} → ${toStatus ?? "?"}`,
        subtitle: `Email ${deliveryStatus ?? "pending"}`,
      };
    },
  },
});
