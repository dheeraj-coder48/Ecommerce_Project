import nodemailer from "nodemailer";

type ConfirmationItem = {
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
};

type OrderConfirmation = {
  recipient: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  items: ConfirmationItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address?: Record<string, string | undefined>;
  orderUrl: string;
};

type FulfillmentStatusEmail = {
  recipient: string;
  orderNumber: string;
  status: string;
  items: Array<{ name: string; quantity: number }>;
  address?: Record<string, string | undefined>;
  orderUrl: string;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } =
    process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 60_000,
  });
}

export async function sendOrderConfirmationEmail(order: OrderConfirmation) {
  if (!validEmail(order.recipient)) {
    throw new Error("Order customer email is missing or invalid");
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("Email sender or site URL configuration is missing");
  }

  const addressLines = order.address
    ? Object.values(order.address).filter((value): value is string =>
        Boolean(value),
      )
    : [];
  const itemRows = order.items
    .map((item) => {
      const image = item.image
        ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="72" style="display:block;width:72px;height:auto;border:0">`
        : "";
      const variants = [
        item.size && `Size: ${item.size}`,
        item.color && `Color: ${item.color}`,
      ]
        .filter(Boolean)
        .join(" · ");
      return `<tr><td style="padding:16px 8px 16px 0;vertical-align:top">${image}</td><td style="padding:16px 8px;vertical-align:top"><strong>${escapeHtml(item.name)}</strong>${variants ? `<br><span style="color:#6b6b63;font-size:13px">${escapeHtml(variants)}</span>` : ""}<br><span style="color:#6b6b63;font-size:13px">Qty ${item.quantity} · ${formatINR(item.unitPrice)} each</span></td><td style="padding:16px 0;text-align:right;vertical-align:top;white-space:nowrap">${formatINR(item.unitPrice * item.quantity)}</td></tr>`;
    })
    .join("");
  const addressHtml = addressLines
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  const addressText = addressLines.length
    ? `\nDelivery address\n${addressLines.join("\n")}\n`
    : "";
  const orderLink = order.orderUrl;
  const plainItems = order.items
    .map(
      (item) =>
        `• ${item.name}${item.size ? ` · Size ${item.size}` : ""}${item.color ? ` · ${item.color}` : ""} · Qty ${item.quantity} · ${formatINR(item.unitPrice)} each · ${formatINR(item.unitPrice * item.quantity)}`,
    )
    .join("\n");

  const result = await getTransport().sendMail({
    from: { name: "Kumar Collection", address: fromEmail },
    to: order.recipient,
    subject: `Order confirmed · ${order.orderNumber}`,
    text: `Thank you for shopping with Kumar Collection.\n\nOrder ${order.orderNumber}\nPlaced ${order.orderDate}\nPayment status: Paid\n\n${plainItems}\n\nSubtotal: ${formatINR(order.subtotal)}\nShipping: ${order.shipping === 0 ? "Free" : formatINR(order.shipping)}\nTotal: ${formatINR(order.total)}\n${addressText}\nView your order: ${orderLink}\n`,
    html: `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#292823"><div style="display:none;max-height:0;overflow:hidden">Your Kumar Collection order ${escapeHtml(order.orderNumber)} is confirmed.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ee;padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff"><tr><td style="padding:32px 28px;background:#292823;color:#fff;text-align:center"><div style="font-family:Georgia,serif;font-size:27px;letter-spacing:2px">KUMAR COLLECTION</div><div style="margin-top:8px;color:#d5c5ac;font-size:12px;letter-spacing:2px">ORDER CONFIRMATION</div></td></tr><tr><td style="padding:30px 28px"><h1 style="font-family:Georgia,serif;font-size:25px;font-weight:normal;margin:0 0 10px">Thank you for your order</h1><p style="margin:0;color:#666">Order <strong>${escapeHtml(order.orderNumber)}</strong> · ${escapeHtml(order.orderDate)}</p><p style="margin:14px 0 0;color:#526556"><strong>Payment status: Paid</strong></p><h2 style="margin:28px 0 8px;font-size:16px">Your items</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e8e2d9">${itemRows}</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e8e2d9"><tr><td style="padding:8px 0">Subtotal</td><td style="padding:8px 0;text-align:right">${formatINR(order.subtotal)}</td></tr><tr><td style="padding:8px 0">Shipping</td><td style="padding:8px 0;text-align:right">${order.shipping === 0 ? "Free" : formatINR(order.shipping)}</td></tr><tr><td style="padding:12px 0;border-top:1px solid #e8e2d9;font-weight:bold">Total</td><td style="padding:12px 0;border-top:1px solid #e8e2d9;text-align:right;font-weight:bold">${formatINR(order.total)}</td></tr></table>${addressHtml ? `<h2 style="margin:28px 0 10px;font-size:16px">Delivery address</h2><div style="color:#666;line-height:1.6">${addressHtml}</div>` : ""}<div style="text-align:center;margin:30px 0 12px"><a href="${escapeHtml(orderLink)}" style="display:inline-block;background:#35483d;color:#fff;text-decoration:none;padding:14px 24px;font-size:14px">View your order</a></div></td></tr><tr><td style="padding:20px 28px;background:#faf9f6;text-align:center;color:#777;font-size:12px">Thank you for choosing Kumar Collection.</td></tr></table></td></tr></table></body></html>`,
  });

  const recipientAccepted = result.accepted.some((accepted) => {
    return accepted.toLowerCase() === order.recipient.trim().toLowerCase();
  });
  if (!recipientAccepted) {
    throw new Error("SMTP did not accept the order recipient");
  }
}

export async function sendFulfillmentStatusEmail(
  order: FulfillmentStatusEmail,
) {
  if (!validEmail(order.recipient)) {
    throw new Error("Order customer email is missing or invalid");
  }
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  if (!fromEmail) throw new Error("Email sender configuration is missing");

  const addressLines = order.address
    ? Object.values(order.address).filter((value): value is string =>
        Boolean(value),
      )
    : [];
  const addressHtml = addressLines
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join("");
  const addressText = addressLines.length
    ? `\nDelivery address\n${addressLines.join("\n")}\n`
    : "";
  const itemsText = order.items
    .map((item) => `• ${item.name} · Qty ${item.quantity}`)
    .join("\n");
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li style="padding:7px 0">${escapeHtml(item.name)} <span style="color:#666">· Qty ${item.quantity}</span></li>`,
    )
    .join("");
  const subject = `Order ${order.status.toLowerCase()} · ${order.orderNumber}`;
  const result = await getTransport().sendMail({
    from: { name: "Kumar Collection", address: fromEmail },
    to: order.recipient,
    subject,
    text: `Kumar Collection order update\n\nOrder ${order.orderNumber}\nStatus: ${order.status}\n\nItems\n${itemsText}${addressText}\nView your order: ${order.orderUrl}\n`,
    html: `<!doctype html><html><body style="margin:0;background:#f5f3ee;font-family:Arial,sans-serif;color:#292823"><div style="display:none;max-height:0;overflow:hidden">Order ${escapeHtml(order.orderNumber)} is ${escapeHtml(order.status.toLowerCase())}.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f3ee;padding:24px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff"><tr><td style="padding:32px 28px;background:#292823;color:#fff;text-align:center"><div style="font-family:Georgia,serif;font-size:27px;letter-spacing:2px">KUMAR COLLECTION</div><div style="margin-top:8px;color:#d5c5ac;font-size:12px;letter-spacing:2px">ORDER UPDATE</div></td></tr><tr><td style="padding:30px 28px"><h1 style="font-family:Georgia,serif;font-size:25px;font-weight:normal;margin:0 0 10px">Your order is ${escapeHtml(order.status.toLowerCase())}</h1><p style="margin:0;color:#666">Order <strong>${escapeHtml(order.orderNumber)}</strong></p><div style="margin:22px 0;padding:16px;background:#f5f3ee;color:#35483d;font-size:18px;font-weight:bold">${escapeHtml(order.status)}</div><h2 style="font-size:16px">Order summary</h2><ul style="padding-left:20px;line-height:1.5">${itemsHtml}</ul>${addressHtml ? `<h2 style="margin:24px 0 10px;font-size:16px">Delivery address</h2><div style="color:#666;line-height:1.6">${addressHtml}</div>` : ""}<div style="text-align:center;margin:30px 0 12px"><a href="${escapeHtml(order.orderUrl)}" style="display:inline-block;background:#35483d;color:#fff;text-decoration:none;padding:14px 24px;font-size:14px">View your order</a></div></td></tr><tr><td style="padding:20px 28px;background:#faf9f6;text-align:center;color:#777;font-size:12px">Thank you for choosing Kumar Collection.</td></tr></table></td></tr></table></body></html>`,
  });

  if (
    !result.accepted.some(
      (accepted) =>
        accepted.toLowerCase() === order.recipient.trim().toLowerCase(),
    )
  ) {
    throw new Error("SMTP did not accept the order recipient");
  }
}
