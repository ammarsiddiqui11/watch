// controllers/orderController.js
import Stripe from "stripe";
import Order from "../models/orderModel.js";
import { v4 as uuidv4 } from "uuid";
import {
  sendOrderConfirmationEmail,
  sendStatusUpdateEmail,
} from "../services/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// ── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, address, notes } = req.body;
    let { items, paymentMethod } = req.body;

    if (!name || !email || !phoneNumber || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, email, mobile and address are required.",
      });
    }

    const normalizedItems = items.map((it) => ({
      productId: String(it.productId ?? it.id ?? it._id ?? ""),
      name: String(it.name ?? ""),
      img: it.img ?? null,
      price: Number(it.price),
      qty: Number(it.qty ?? it.quantity ?? 1),
      description: String(it.description ?? ""),
    }));

    const normalizedPaymentMethod =
      paymentMethod === "Cash on Delivery" ? "Cash on Delivery" : "Online";

    const subtotal = normalizedItems.reduce((s, it) => s + it.price * it.qty, 0);
    const taxRate = 0.08;
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const shippingCharge = 0;
    const finalAmount = parseFloat((subtotal + taxAmount + shippingCharge).toFixed(2));

    const orderId = `ORD-${uuidv4()}`;
    const orderPayload = {
      orderId,
      user: req.user?._id ?? undefined,
      name,
      email,
      phoneNumber,
      address,
      items: normalizedItems,
      shippingCharge,
      totalAmount: subtotal,
      taxAmount,
      finalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "Unpaid",
      notes: notes ?? undefined,
    };

    // ── Online (Stripe) ──────────────────────────────────────────────────────
    if (normalizedPaymentMethod === "Online") {
      const line_items = normalizedItems.map((it) => ({
        price_data: {
          currency: "inr",
          product_data: { name: it.name },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.qty,
      }));

      if (taxAmount > 0) {
        line_items.push({
          price_data: {
            currency: "inr",
            product_data: { name: `Tax (${(taxRate * 100).toFixed(0)}%)` },
            unit_amount: Math.round(taxAmount * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        customer_email: email,
        success_url: `${process.env.FRONTEND_URL}orders/success?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
        cancel_url: `${process.env.FRONTEND_URL}orders/cancel?payment_status=cancel`,
        metadata: { orderId },
      });

      const order = new Order({
        ...orderPayload,
        sessionId: session.id,
        paymentIntentId: session.payment_intent ?? undefined,
      });

      await order.save();

      // Send confirmation email (fire-and-forget — don't block the response)
      sendOrderConfirmationEmail(order).catch((err) =>
        console.error("Order confirmation email failed:", err)
      );

      return res.status(201).json({
        success: true,
        order,
        checkoutUrl: session.url,
      });
    }

    // ── COD ─────────────────────────────────────────────────────────────────
    const order = new Order(orderPayload);
    await order.save();

    sendOrderConfirmationEmail(order).catch((err) =>
      console.error("COD confirmation email failed:", err)
    );

    return res.status(201).json({
      success: true,
      order,
      checkoutUrl: null,
    });
  } catch (err) {
    if (err?.status) {
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── Confirm Stripe Payment ───────────────────────────────────────────────────
export const confirmPayment = async (req, res, next) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res
        .status(400)
        .json({ success: false, message: "session_id required" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session)
      return res
        .status(400)
        .json({ success: false, message: "Invalid session" });

    if (session.payment_status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed" });
    }

    const order = await Order.findOneAndUpdate(
      { sessionId: session_id },
      { paymentStatus: "Paid", paymentIntentId: session.payment_intent },
      { new: true }
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ── Get All Orders (admin) ───────────────────────────────────────────────────
export const getOrders = async (req, res, next) => {
  try {
    const { search = "", status } = req.query;
    const filter = {};

    if (status && status !== "All") filter.orderStatus = status;

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { orderId: regex },
        { name: regex },
        { email: regex },
        { "items.name": regex },
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    const counts = orders.reduce(
      (acc, o) => {
        acc.totalOrders += 1;
        acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
        if (o.paymentStatus === "Unpaid") acc.pendingPayment += 1;
        return acc;
      },
      { totalOrders: 0, pendingPayment: 0 }
    );

    return res.json({
      success: true,
      counts: {
        totalOrders: counts.totalOrders,
        pending: counts.Pending || 0,
        confirmed: counts.Confirmed || 0,
        completed: counts.Completed || 0,
        cancelled: counts.Cancelled || 0,
        pendingPayment: counts.pendingPayment,
      },
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get User's Own Orders ────────────────────────────────────────────────────
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user?._id)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("getUserOrders error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch user orders" });
  }
};

// ── Update Order Status (admin) — sends email ────────────────────────────────
export const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res
        .status(400)
        .json({ success: false, message: "orderStatus is required" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Prevent re-updating a cancelled order
    if (order.orderStatus === "Cancelled" && orderStatus !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a cancelled order.",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    // Send status update email (fire-and-forget)
    sendStatusUpdateEmail(order, orderStatus).catch((err) =>
      console.error("Status update email failed:", err)
    );

    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ── Delete Order ─────────────────────────────────────────────────────────────
export const deleteOrder = async (req, res, next) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id).lean();
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    return res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
};