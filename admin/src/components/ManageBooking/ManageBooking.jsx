import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  Phone,
  MapPin,
  MessageSquare,
  Calendar,
  Watch,
  ChevronDown,
  Trash2,
  Search,
  CreditCard,
} from "lucide-react";
import { bookingStyles, statusBadgeStyles, paymentBadgeStyles, badgeBaseStyles, paymentBadgeBaseStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000/api";

const axiosInstance = axios.create({ baseURL: API_BASE });
axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("authtoken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const ManageBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // helper: normalize image URLs so admin doesn't try to fetch localhost
const baseHost = (API_BASE || "").replace(/\/api\/?$/i, "")

function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";

  // Relative path -> prefix with baseHost
  if (raw.startsWith("/")) {
    return `${baseHost}${raw}`;
  }

  // Replace localhost/127.0.0.1 with production host
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }

  // If admin is served over https and raw is http, try upgrading to https (avoid mixed content)
  if (raw.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    try {
      const u = new URL(raw);
      u.protocol = "https:";
      return u.toString();
    } catch (e) {
      // fall back to raw if parsing fails
    }
  }

  return raw;
}

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/orders");
      const orders = Array.isArray(res?.data?.orders)
        ? res.data.orders
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setBookings(orders.map(mapOrderToBooking));
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  }

  const mapOrderToBooking = (o) => {
const items = (o.items || []).map((it) => {
  const rawImg = it.img ?? null;
  return {
    productId: it.productId ?? null,
    name: String(it.name ?? ""),
    img: normalizeImageUrl(rawImg),
    price: Number(it.price ?? 0),
    qty: Number(it.qty ?? 1),
    description: it.description,
  };
});


    return {
      id: o._id,
      orderId: o.orderId,
      userId: o.user ?? null,
      paymentStatus: o.paymentStatus ?? "Unpaid",
      paymentMethod: o.paymentMethod ?? "Online",
      customerName: o.name ?? "Customer",
      email: o.email,
      phone: o.phoneNumber,
      address: o.address,
      notes: o.notes,
      shippingCharge: Number(o.shippingCharge ?? 0),
      totalAmount: Number(o.totalAmount ?? 0),
      taxAmount: Number(o.taxAmount ?? 0),
      finalAmount: Number(o.finalAmount ?? 0),
      watches: items,
      date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—",
      status: o.orderStatus ?? "Pending",
      raw: o,
    };
  };

  async function deleteBooking(id) {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await axiosInstance.delete(`/orders/${id}`);
      setBookings((p) => p.filter((b) => b.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete booking");
    }
  }

  async function updateStatus(id, newStatus) {
    const current = bookings.find((b) => b.id === id);
    if (String(current?.status ?? "").toLowerCase() === "cancelled") {
      alert("Cannot update status of a cancelled booking.");
      return;
    }

    const prev = bookings;
    setBookings((p) =>
      p.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    try {
      await axiosInstance.put(`/orders/${id}`, { orderStatus: newStatus });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update status");
      fetchOrders();
    }
  }

  const toggle = (id) =>
    setExpanded((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const q = searchTerm.trim().toLowerCase();
  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !q ||
      b.customerName.toLowerCase().includes(q) ||
      (b.email || "").toLowerCase().includes(q) ||
      b.watches.some((w) => (w.name || "").toLowerCase().includes(q));
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusBadge = ({ status }) => {
    const styleClass = statusBadgeStyles[status] || statusBadgeStyles.default;
    return (
      <span className={`${badgeBaseStyles} ${styleClass}`}>
        {status}
      </span>
    );
  };

  const PaymentBadge = ({ status }) => {
    const styleClass = paymentBadgeStyles[status] || paymentBadgeStyles.default;
    return (
      <span className={`${paymentBadgeBaseStyles} ${styleClass}`}>
        <CreditCard className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className={bookingStyles.root}>
      <div className={bookingStyles.container}>
        <div className={bookingStyles.headerContainer}>
          <div className={bookingStyles.headerIcon}>
            <Calendar className={bookingStyles.headerIconInner} />
          </div>
          <div>
            <h1 className={bookingStyles.headerTitle}>
              Manage Bookings
            </h1>
            <p className={bookingStyles.headerSubtitle}>
              View and manage customer bookings
            </p>
          </div>
        </div>

        <div className={bookingStyles.infoCard}>
          <div className={bookingStyles.filterContainer}>
            <h2 className={bookingStyles.infoCardTitle}>
              All Bookings ({filtered.length})
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className={bookingStyles.searchContainer}>
                <Search className={bookingStyles.searchIcon} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={bookingStyles.searchInput}
                  placeholder="Search bookings..."
                />
              </div>

              <div className={bookingStyles.filterSelectContainer}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={bookingStyles.filterSelect}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className={bookingStyles.filterSelectIcon} />
              </div>
            </div>
          </div>
        </div>

        <div className={bookingStyles.bookingsContainer}>
          {loading && <div className={bookingStyles.loadingText}>Loading bookings…</div>}
          {error && (
            <div className={bookingStyles.errorText}>{error}</div>
          )}

          {filtered.length === 0 ? (
            <div className={bookingStyles.noBookingsContainer}>
              <Calendar className={bookingStyles.noBookingsIcon} />
              <p className={bookingStyles.noBookingsText}>No bookings found</p>
            </div>
          ) : (
            filtered.map((b) => {
              const isCancelled =
                String(b.status ?? "").toLowerCase() === "cancelled";
              return (
                <div
                  key={b.id}
                  className={bookingStyles.bookingCard}
                >
                  <div className={bookingStyles.bookingHeader}>
                    <div className={bookingStyles.customerContainer}>
                      <div className={bookingStyles.customerAvatar}>
                        <User className={bookingStyles.customerIcon} />
                      </div>
                      <div className="min-w-0">
                        <h3 className={bookingStyles.customerName}>
                          {b.customerName}
                        </h3>
                        <p className={bookingStyles.customerInfo}>
                          {b.email}{" "}
                          <span className={bookingStyles.customerSeparator}>·</span>
                          <span className={bookingStyles.orderId}>
                            Order:{" "}
                            <span className={bookingStyles.orderIdValue}>
                              {b.orderId}
                            </span>
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className={bookingStyles.actionsContainer}>
                      <StatusBadge status={b.status} />
                      <PaymentBadge status={b.paymentStatus} />

                      <div className={bookingStyles.actionButtonGroup}>
                        <select
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          disabled={isCancelled}
                          title={
                            isCancelled
                              ? "Cannot update status of a cancelled booking"
                              : "Change booking status"
                          }
                          className={`${bookingStyles.statusSelect} ${
                            isCancelled
                              ? bookingStyles.statusSelectDisabled
                              : bookingStyles.statusSelectEnabled
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <button
                          onClick={() => deleteBooking(b.id)}
                          className={bookingStyles.deleteButton}
                          title="Delete booking"
                        >
                          <Trash2 className={bookingStyles.deleteIcon} />
                        </button>

                        <button
                          onClick={() => toggle(b.id)}
                          className={bookingStyles.toggleButton}
                        >
                          {expanded.includes(b.id)
                            ? "Hide Details"
                            : "View Details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expanded.includes(b.id) && (
                    <div className={bookingStyles.expandedContainer}>
                      <div>
                        <h4 className={bookingStyles.sectionTitle}>
                          <User className={bookingStyles.sectionIcon} /> Customer Details
                        </h4>
                        <InfoRow
                          icon={<Phone className="w-4 h-4" />}
                          label="Phone"
                          value={b.phone}
                        />
                        <InfoRow
                          icon={<MapPin className="w-4 h-4" />}
                          label="Address"
                          value={b.address}
                        />
                        <InfoRow
                          icon={<Calendar className="w-4 h-4" />}
                          label="Booking Date"
                          value={b.date}
                        />
                        <div className={bookingStyles.paymentBadgeContainer}>
                          <div className={bookingStyles.paymentBadgeIconContainer}>
                            <CreditCard className={bookingStyles.paymentBadgeIcon} />
                          </div>
                          <div className="text-sm">
                            <div className={bookingStyles.paymentBadgeLabel}>Payment Status</div>
                            <div className={bookingStyles.infoRowValue}>
                              <PaymentBadge status={b.paymentStatus} />
                            </div>
                          </div>
                        </div>
                        <InfoRow
                          icon={<Calendar className="w-4 h-4" />}
                          label="Order ID"
                          value={b.orderId}
                        />
                        {b.notes && (
                          <div className="flex items-start gap-3">
                            <div className={bookingStyles.infoRowIcon}>
                              <MessageSquare className={bookingStyles.sectionIcon} />
                            </div>
                            <div className="text-sm flex-1 break-words">
                              <div className={bookingStyles.infoRowLabel}>Notes</div>
                              <div className={bookingStyles.infoRowValue}>
                                {b.notes}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className={bookingStyles.sectionTitle}>
                          <Watch className={bookingStyles.sectionIcon} /> Watch Details
                        </h4>
                        <div className={bookingStyles.watchContainer}>
                          {b.watches.map((w, i) => (
                            <div
                              key={i}
                              className={bookingStyles.watchItem}
                            >
                              <div className={bookingStyles.watchImageContainer}>
                                <div className={bookingStyles.watchImageWrapper}>
                                  {w.img ? (
                           <img
  src={w.img}
  alt={w.name}
  className={bookingStyles.watchImage}
  onError={(e) => {
    e.currentTarget.style.objectFit = "contain";
    e.currentTarget.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
  }}
/>

                                  ) : (
                                    <div className={bookingStyles.watchNoImage}>
                                      No image
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={bookingStyles.watchDetails}>
                                <h5 className={bookingStyles.watchTitle}>
                                  {w.name}
                                </h5>
                                <div className={bookingStyles.watchInfoContainer}>
                                  <div>
                                    <span className={bookingStyles.watchInfoLabel}>
                                      Price:
                                    </span>
                                    ₹{Number(w.price).toLocaleString()}
                                  </div>
                                  <div>
                                    <span className={bookingStyles.watchInfoLabel}>
                                      Qty:
                                    </span>
                                    {w.qty}
                                  </div>
                                  <div>
                                    <span className={bookingStyles.watchInfoLabel}>
                                      ProductId:
                                    </span>
                                    {w.productId ?? "—"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={bookingStyles.priceSummary}>
                          <div>
                            <span className={bookingStyles.priceRow}>
                              Subtotal:{" "}
                            </span>
                            ₹{Number(b.totalAmount).toLocaleString()}
                          </div>
                          <div>
                            <span className={bookingStyles.priceRow}>
                              Tax:{" "}
                            </span>
                            ₹{Number(b.taxAmount).toLocaleString()}
                          </div>
                          <div>
                            <span className={bookingStyles.priceRow}>
                              Shipping:{" "}
                            </span>
                            ₹{Number(b.shippingCharge).toLocaleString()}
                          </div>
                          <div className={bookingStyles.finalPrice}>
                            <span className={bookingStyles.priceRow}>
                              Final:{" "}
                            </span>
                            ₹{Number(b.finalAmount).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className={bookingStyles.infoRowContainer}>
    <div className={bookingStyles.infoRowIcon}>
      {icon}
    </div>
    <div className="text-sm">
      <div className={bookingStyles.infoRowLabel}>{label}</div>
      <div className={bookingStyles.infoRowValue}>{value}</div>
    </div>
  </div>
);

export default ManageBooking;