// services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // fixes self-signed cert error in local dev
  },
});

// ── Shared HTML shell ───────────────────────────────────────────────────────
function htmlShell(bodyContent) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ChronoLite</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f1f5f9; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #0f172a; padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; font-size: 22px; letter-spacing: 2px; font-weight: 700; }
    .header p { color: #94a3b8; font-size: 12px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #0f172a; }
    .subtext { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 28px; }
    .status-confirmed  { background: #dcfce7; color: #15803d; }
    .status-pending    { background: #fef9c3; color: #854d0e; }
    .status-cancelled  { background: #fee2e2; color: #b91c1c; }
    .status-completed  { background: #dbeafe; color: #1d4ed8; }
    .status-shipped    { background: #f3e8ff; color: #7e22ce; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
    .order-box-title { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .order-meta { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .order-meta:last-child { border-bottom: none; }
    .order-meta .label { color: #64748b; }
    .order-meta .value { font-weight: 600; color: #0f172a; }
    .items-title { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .item-row:last-child { border-bottom: none; }
    .item-name { font-weight: 600; color: #1e293b; }
    .item-qty  { color: #64748b; font-size: 12px; margin-top: 2px; }
    .item-price { font-weight: 700; color: #0f172a; }
    .totals { margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: #64748b; }
    .total-row.final { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 8px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .footer { background: #f8fafc; padding: 24px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer strong { color: #64748b; }
    @media (max-width: 600px) {
      .body { padding: 24px; }
      .header { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>⌚ CHRONOLITE</h1>
      <p>Premium Timepieces</p>
    </div>
    <div class="body">${bodyContent}</div>
    <div class="footer">
      <p>
        <strong>ChronoLite</strong><br/>
        You're receiving this because you placed an order with us.<br/>
        © ${new Date().getFullYear()} ChronoLite. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Build items table ───────────────────────────────────────────────────────
function itemsHtml(items) {
  const rows = items
    .map(
      (it) => `
      <div class="item-row">
        <div>
          <div class="item-name">${it.name}</div>
          <div class="item-qty">Qty: ${it.qty}</div>
        </div>
        <div class="item-price">₹${(it.price * it.qty).toLocaleString("en-IN")}</div>
      </div>`
    )
    .join("");

  return rows;
}

function totalsHtml(order) {
  return `
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>₹${Number(order.totalAmount).toLocaleString("en-IN")}</span></div>
      <div class="total-row"><span>Tax (8%)</span><span>₹${Number(order.taxAmount).toLocaleString("en-IN")}</span></div>
      <div class="total-row"><span>Shipping</span><span>Free</span></div>
      <div class="total-row final"><span>Total</span><span>₹${Number(order.finalAmount).toLocaleString("en-IN")}</span></div>
    </div>`;
}

// ── Email: Order Placed (COD or Online) ────────────────────────────────────
export async function sendOrderConfirmationEmail(order) {
  const isCOD = order.paymentMethod === "Cash on Delivery";

  const body = `
    <p class="greeting">Hello, ${order.name}!</p>
    <p class="subtext">
      ${
        isCOD
          ? "Thank you for your order! We've received it and will start processing shortly. Payment will be collected on delivery."
          : "Thank you for your order! Your payment was received and we're getting things ready."
      }
    </p>

    <div class="order-box">
      <div class="order-box-title">Order Details</div>
      <div class="order-meta"><span class="label">Order ID</span><span class="value">${order.orderId}</span></div>
      <div class="order-meta"><span class="label">Payment</span><span class="value">${order.paymentMethod}</span></div>
      <div class="order-meta"><span class="label">Address</span><span class="value">${order.address}</span></div>
      ${order.notes ? `<div class="order-meta"><span class="label">Notes</span><span class="value">${order.notes}</span></div>` : ""}
    </div>

    <div class="items-title">Items Ordered</div>
    ${itemsHtml(order.items)}
    ${totalsHtml(order)}

    <hr class="divider"/>
    <p class="subtext">We'll notify you as your order progresses. Keep this email for your reference.</p>
  `;

  await transporter.sendMail({
    from: `"ChronoLite" <${process.env.GMAIL_USER}>`,
    to: order.email,
    subject: `Order Confirmed — ${order.orderId} | ChronoLite`,
    html: htmlShell(body),
  });
}

// ── Email: Status Update ────────────────────────────────────────────────────
const STATUS_COPY = {
  Confirmed: {
    badge: "status-confirmed",
    headline: "Your order has been confirmed! 🎉",
    message: "Great news — our team has confirmed your order and it's being prepared with care.",
  },
  Completed: {
    badge: "status-completed",
    headline: "Your order is complete ✅",
    message: "Your order has been successfully delivered. We hope you love your new timepiece!",
  },
  Cancelled: {
    badge: "status-cancelled",
    headline: "Your order has been cancelled",
    message: "Unfortunately your order has been cancelled. If you have any questions please contact our support team.",
  },
  Pending: {
    badge: "status-pending",
    headline: "Your order is pending",
    message: "Your order is currently pending. We'll update you as soon as it's confirmed.",
  },
  Shipped: {
    badge: "status-shipped",
    headline: "Your order is on its way! 🚚",
    message: "Your order has been dispatched and is on its way to you. Sit tight!",
  },
};

export async function sendStatusUpdateEmail(order, newStatus) {
  const copy = STATUS_COPY[newStatus] ?? {
    badge: "status-pending",
    headline: `Order status updated to ${newStatus}`,
    message: "Your order status has been updated.",
  };

  const body = `
    <p class="greeting">Hello, ${order.name}!</p>
    <p class="subtext">There's an update on your order.</p>

    <span class="status-badge ${copy.badge}">${newStatus}</span>

    <p class="greeting" style="font-size:16px; margin-bottom:8px;">${copy.headline}</p>
    <p class="subtext">${copy.message}</p>

    <div class="order-box">
      <div class="order-box-title">Order Reference</div>
      <div class="order-meta"><span class="label">Order ID</span><span class="value">${order.orderId}</span></div>
      <div class="order-meta"><span class="label">Payment Method</span><span class="value">${order.paymentMethod}</span></div>
      <div class="order-meta"><span class="label">Total</span><span class="value">₹${Number(order.finalAmount).toLocaleString("en-IN")}</span></div>
    </div>

    <div class="items-title">Items</div>
    ${itemsHtml(order.items)}

    <hr class="divider"/>
    <p class="subtext">Visit your orders page to track all your orders in real time.</p>
  `;

  await transporter.sendMail({
    from: `"ChronoLite" <${process.env.GMAIL_USER}>`,
    to: order.email,
    subject: `Order ${newStatus} — ${order.orderId} | ChronoLite`,
    html: htmlShell(body),
  });
}