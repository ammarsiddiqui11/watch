import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingBag, Calendar, Package, Eye, EyeOff } from "lucide-react";
import { ordersPageStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/orders/my");
      const payload = res?.data;
      const list = Array.isArray(payload?.orders)
        ? payload.orders
        : Array.isArray(payload)
        ? payload
        : payload?.orders ?? [];
      setOrders(list);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }

  const getKey = (o) => o._id ?? o.orderId ?? o.id ?? JSON.stringify(o);
  const toggle = (k) =>
    setExpanded((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const formatDate = (o) => {
    const d = o.createdAt ?? o.placedAt ?? o.date ?? o.updatedAt ?? null;
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d).slice(0, 10);
    }
  };

  const formatPrice = (o) => {
    if (o.finalAmount != null)
      return `₹${Number(o.finalAmount).toLocaleString()}`;
    if (o.totalAmount != null)
      return `₹${Number(o.totalAmount).toLocaleString()}`;
    const items = o.items ?? [];
    if (!items.length) return "₹0";
    const sum = items.reduce((acc, it) => {
      const p =
        typeof it.price === "number"
          ? it.price
          : Number(String(it.price ?? "").replace(/[^0-9.-]+/g, "")) || 0;
      const q = Number(it.qty ?? it.quantity ?? 1) || 1;
      return acc + p * q;
    }, 0);
    return `₹${sum.toLocaleString()}`;
  };

  const handleCancel = async (order) => {
    const id = order._id ?? order.orderId ?? order.id;
    if (!id) return alert("Cannot determine order id to cancel.");
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    const curStatus = (
      order.orderStatus ??
      order.status ??
      order.paymentStatus ??
      ""
    )
      .toString()
      .toLowerCase();
    if (curStatus === "cancelled") return alert("Order is already cancelled.");

    const prev = [...orders];
    const key = getKey(order);
    setOrders((arr) =>
      arr.map((o) =>
        getKey(o) === key
          ? { ...o, orderStatus: "Cancelled", status: "Cancelled" }
          : o
      )
    );
    try {
      await axiosInstance.put(`/orders/${id}`, { orderStatus: "Cancelled" });
    } catch (err) {
      console.error("Cancel order failed", err);
      setOrders(prev);
      alert(err?.response?.data?.message || "Failed to cancel order");
    }
  };

  // helper: return tailwind classes for different statuses
  const statusClass = (status) => {
    const s = String(status ?? "").trim().toLowerCase();
    // Pending / Awaiting payment
    if (s.includes("pending") || s.includes("awaiting")) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusPending}`;
    }
    // Completed / Delivered / Paid
    if (
      s.includes("completed") ||
      s.includes("complete") ||
      s.includes("delivered") ||
      s.includes("paid")
    ) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusCompleted}`;
    }
    // Cancelled / Cancel
    if (s.includes("cancel") || s.includes("canceled") || s.includes("cancelled")) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusCancelled}`;
    }
    // Processing / Shipped / In transit
    if (
      s.includes("processing") ||
      s.includes("shipped") ||
      s.includes("in transit") ||
      s.includes("transit")
    ) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusProcessing}`;
    }
    // Failed / Declined / Error
    if (s.includes("failed") || s.includes("declined") || s.includes("error")) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusFailed}`;
    }
    // Refunded
    if (s.includes("refund") || s.includes("refunded")) {
      return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusRefunded}`;
    }
    // Default fallback
    return `${ordersPageStyles.statusBadgeBase} ${ordersPageStyles.statusDefault}`;
  };

  return (
    <div className={ordersPageStyles.pageContainer}>
      <div className={ordersPageStyles.innerContainer}>
        <div className={ordersPageStyles.headerContainer}>
          <h1 className={ordersPageStyles.titleContainer}>
            <ShoppingBag className={ordersPageStyles.titleIcon} /> My Orders
          </h1>
          <button
            onClick={fetchOrders}
            className={ordersPageStyles.refreshButton}
          >
            Refresh
          </button>
        </div>

        {loading && <p className={ordersPageStyles.loadingText}>Loading orders…</p>}
        {error && <p className={ordersPageStyles.errorText}>{error}</p>}

        <div className={ordersPageStyles.ordersContainer}>
          {!orders.length && !loading ? (
            <div className={ordersPageStyles.emptyStateContainer}>
              <p className={ordersPageStyles.emptyStateText}>No orders found.</p>
            </div>
          ) : (
            orders.map((order, idx) => {
              const key = getKey(order);
              const isExpanded = expanded.includes(key);
              const items = (order.items || []).map((it, i) => ({
                id: it.productId ?? it._id ?? it.id ?? i,
                name: String(it.name ?? ""),
                price:
                  typeof it.price === "number"
                    ? `₹${it.price.toLocaleString()}`
                    : it.price ?? "₹0",
                qty: it.qty ?? it.quantity ?? 1,
                img: it.img ?? null,
              }));
              const status =
                order.orderStatus ?? order.status ?? order.paymentStatus ?? "—";
              const orderIsCancelled =
                String(status).toLowerCase() === "cancelled";

              return (
                <div
                  key={key}
                  className={ordersPageStyles.orderCard}
                >
                  <div className={ordersPageStyles.orderHeader}>
                    <div>
                      <h2 className={ordersPageStyles.orderTitle}>
                        Order #{order.orderId ?? order._id ?? order.id}
                      </h2>
                      <p className={ordersPageStyles.orderDateContainer}>
                        <Calendar className={ordersPageStyles.orderDateIcon} /> {formatDate(order)}
                      </p>
                    </div>

                    <div className={ordersPageStyles.statusAndActions}>
                      <span className={statusClass(status)} aria-label={`Status: ${status}`}>
                        {status}
                      </span>

                      <button
                        onClick={() => toggle(key)}
                        className={ordersPageStyles.toggleButton}
                      >
                        {isExpanded ? (
                          <>
                            <EyeOff className={ordersPageStyles.toggleIcon} /> Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className={ordersPageStyles.toggleIcon} /> View Details
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCancel(order)}
                        disabled={orderIsCancelled}
                        className={`${ordersPageStyles.cancelButtonBase} ${
                          orderIsCancelled
                            ? ordersPageStyles.cancelButtonDisabled
                            : ordersPageStyles.cancelButtonEnabled
                        }`}
                        title={
                          orderIsCancelled
                            ? "Order already cancelled"
                            : "Cancel order"
                        }
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className={ordersPageStyles.itemsGrid}>
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className={ordersPageStyles.itemCard}
                          >
                            {it.img ? (
                              <img
                                src={it.img}
                                alt={it.name}
                                className={ordersPageStyles.itemImage}
                              />
                            ) : (
                              <div className={ordersPageStyles.itemNoImage}>
                                No image
                              </div>
                            )}
                            <div className={ordersPageStyles.itemDetails}>
                              <h3 className={ordersPageStyles.itemName}>
                                {it.name}
                              </h3>
                              <p className={ordersPageStyles.itemPrice}>{it.price}</p>
                              <p className={ordersPageStyles.itemQuantity}>
                                Qty: {it.qty}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={ordersPageStyles.deliveryDetailsContainer}>
                        <h3 className={ordersPageStyles.deliveryTitle}>
                          <Package className={ordersPageStyles.deliveryIcon} /> Delivery Details
                        </h3>
                        <div className={ordersPageStyles.deliveryGrid}>
                          <p>
                            <span className={ordersPageStyles.deliveryLabel}>Name:</span>{" "}
                            {order.name ?? "—"}
                          </p>
                          <p>
                            <span className={ordersPageStyles.deliveryLabel}>Email:</span>{" "}
                            {order.email ?? "—"}
                          </p>
                          <p>
                            <span className={ordersPageStyles.deliveryLabel}>Mobile:</span>{" "}
                            {order.phoneNumber ?? "—"}
                          </p>
                          <p>
                            <span className={ordersPageStyles.deliveryLabel}>Payment:</span>{" "}
                            {order.paymentMethod ?? "—"}
                          </p>
                          <p className="sm:col-span-2">
                            <span className={ordersPageStyles.deliveryLabel}>Address:</span>{" "}
                            {order.address ?? "—"}
                          </p>
                          {order.notes && (
                            <p className="sm:col-span-2">
                              <span className={ordersPageStyles.deliveryLabel}>Note:</span>{" "}
                              {order.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className={ordersPageStyles.totalContainer}>
                    <span className={ordersPageStyles.totalLabel}>Total:</span>
                    <span className={ordersPageStyles.totalAmount}>
                      {formatPrice(order)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}