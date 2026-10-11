import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";
import { ORDER_STATUS_SANITY_LIST } from "@/lib/constants/orderStatus";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,
  groups: [
    { name: "details", title: "Order Details", default: true },
    { name: "customer", title: "Customer" },
    { name: "payment", title: "Payment" },
  ],
  fields: [
    defineField({
      name: "orderNumber",
      type: "string",
      group: "details",
      readOnly: true,
      validation: (rule) => [rule.required().error("Order number is required")],
    }),
    defineField({
      name: "items",
      type: "array",
      group: "details",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              type: "reference",
              to: [{ type: "product" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "quantity",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.required().min(1),
            }),
            defineField({
              name: "priceAtPurchase",
              type: "number",
              description: "Price at time of purchase",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "color",
              type: "string",
              title: "Selected Color",
            }),
            defineField({
              name: "size",
              type: "string",
              title: "Selected Size",
            }),
          ],
          preview: {
            select: {
              title: "product.name",
              quantity: "quantity",
              price: "priceAtPurchase",
              color: "color",
              media: "product.images.0",
            },
            prepare({ title, quantity, price, color, media }) {
              return {
                title: title ?? "Product",
                subtitle: `${color ? `${color} · ` : ""}Qty: ${quantity} · ₹${price}`,
                media,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "total",
      type: "number",
      group: "details",
      readOnly: true,
      description: "Total order amount in INR",
    }),
    defineField({
      name: "status",
      type: "string",
      group: "details",
      initialValue: "paid",
      options: {
        list: ORDER_STATUS_SANITY_LIST,
        layout: "radio",
      },
    }),
    defineField({
      name: "paymentStatus",
      type: "string",
      group: "payment",
      readOnly: true,
      initialValue: "paid",
      options: { list: [{ title: "Paid", value: "paid" }] },
    }),
    defineField({
      name: "fulfillmentStatus",
      title: "Fulfillment Status",
      type: "string",
      group: "details",
      initialValue: "processing",
      options: {
        list: ORDER_STATUS_SANITY_LIST.filter(({ value }) => value !== "paid"),
      },
    }),
    defineField({
      name: "fulfillmentUpdatedAt",
      type: "datetime",
      group: "details",
      readOnly: true,
    }),
    defineField({
      name: "customer",
      type: "reference",
      to: [{ type: "customer" }],
      group: "customer",
      description: "Reference to the customer record",
    }),
    defineField({
      name: "clerkUserId",
      type: "string",
      group: "customer",
      readOnly: true,
      description: "Clerk user ID",
    }),
    defineField({
      name: "email",
      type: "string",
      group: "customer",
      readOnly: true,
    }),
    defineField({
      name: "customerPhone",
      title: "Phone Number",
      type: "string",
      group: "customer",
      readOnly: true,
      description: "Indian mobile number collected by Stripe Checkout",
    }),
    defineField({
      name: "address",
      type: "object",
      group: "customer",
      fields: [
        defineField({ name: "name", type: "string", title: "Full Name" }),
        defineField({ name: "line1", type: "string", title: "Address Line 1" }),
        defineField({ name: "line2", type: "string", title: "Address Line 2" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "postcode", type: "string", title: "Postcode" }),
        defineField({ name: "country", type: "string" }),
      ],
    }),
    defineField({
      name: "stripePaymentId",
      type: "string",
      group: "payment",
      readOnly: true,
      description: "Stripe payment intent ID",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      group: "details",
      readOnly: true,
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      orderNumber: "orderNumber",
      email: "email",
      total: "total",
      status: "status",
    },
    prepare({ orderNumber, email, total, status }) {
      return {
        title: `Order ${orderNumber ?? "N/A"}`,
        subtitle: `${email ?? "No email"} • ₹${total ?? 0} • ${status ?? "paid"}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
