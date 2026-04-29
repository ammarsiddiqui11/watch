// src/pages/Admin/ManageBooking.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  User, Phone, MapPin, MessageSquare, Calendar, Watch,
  Trash2, Search, CreditCard, RefreshCw, AlertTriangle,
  CheckCircle2, Package, ChevronDown, ChevronUp, X,
} from "lucide-react";
import {
  bookingStyles, statusBadgeStyles, paymentBadgeStyles,
  badgeBaseStyles, paymentBadgeBaseStyles,
} from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000/api";

const axiosInstance = axios.create({ baseURL: API_BASE });
axiosInstance.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("authtoken");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

const BASE_HOST = API_BASE.replace(/\/api\/?$/i, "");
function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("/")) return `${BASE_HOST}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, BASE_HOST);
  return raw;
}

const STATUS_OPTIONS = ["Pending", "Confirmed", "Shipped", "Completed", "Cancelled"];;

const STATUS_COLORS = {
  Pending:   "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Confirmed: "bg-green-50 text-green-700 border border-green-200",
  Shipped:   "bg-purple-50 text-purple-700 border border-purple-200",
  Completed: "bg-blue-50 text-blue-700 border border-blue-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
  default:   "bg-slate-50 text-slate-600 border border-slate-200",
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle size={22} />
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-semibold transition shadow-lg text-sm ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-1 ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
      {icon}
    </div>
    <div className="text-sm min-w-0">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="text-slate-700 font-medium break-words mt-0.5">{value || "—"}</div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const ManageBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Confirm dialog state
  const [pendingStatus, setPendingStatus] = useState(null); // { id, newStatus }
  const [pendingDelete, setPendingDelete] = useState(null); // id

  const mapOrderToBooking = useCallback((o) => ({
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
    watches: (o.items || []).map((it) => ({
      productId: it.productId ?? null,
      name: String(it.name ?? ""),
      img: normalizeImageUrl(it.img ?? ""),
      price: Number(it.price ?? 0),
      qty: Number(it.qty ?? 1),
    })),
    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    status: o.orderStatus ?? "Pending",
  }), []);

  // ── Fetch — passes search + status to backend for proper orderId search ──
  const fetchOrders = useCallback(async (search = "", status = "All") => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status !== "All") params.status = status;

      const res = await axiosInstance.get("/orders", { params });
      const orders = Array.isArray(res?.data?.orders) ? res.data.orders : [];
      setBookings(orders.map(mapOrderToBooking));
      if (res.data?.counts) setCounts(res.data.counts);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [mapOrderToBooking]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Debounce search — fires backend call so orderId search works
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(searchTerm, statusFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, fetchOrders]);

  // ── Status Update (after confirm) ────────────────────────────────────────
  const confirmStatusUpdate = async () => {
    const { id, newStatus } = pendingStatus;
    setPendingStatus(null);

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    try {
      await axiosInstance.put(`/orders/${id}`, { orderStatus: newStatus });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update status");
      fetchOrders(searchTerm, statusFilter);
    }
  };

  // ── Delete (after confirm) ────────────────────────────────────────────────
  const confirmDelete = async () => {
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await axiosInstance.delete(`/orders/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const toggle = (id) =>
    setExpanded((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const StatusBadge = ({ status }) => (
    <span className={`${badgeBaseStyles} ${statusBadgeStyles[status] || statusBadgeStyles.default}`}>
      {status}
    </span>
  );

  const PaymentBadge = ({ status }) => (
    <span className={`${paymentBadgeBaseStyles} ${paymentBadgeStyles[status] || paymentBadgeStyles.default}`}>
      <CreditCard className="w-3 h-3" /> {status}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
            <p className="text-slate-400 text-sm mt-0.5">View, update and manage customer orders</p>
          </div>
          <button
            onClick={() => fetchOrders(searchTerm, statusFilter)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition bg-white shadow-sm self-start sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Orders" value={counts.totalOrders ?? 0} color="bg-slate-900 text-white" />
          <StatCard label="Pending"      value={counts.pending ?? 0}      color="bg-yellow-50 text-yellow-800" />
          <StatCard label="Confirmed"    value={counts.confirmed ?? 0}    color="bg-green-50 text-green-800" />
          <StatCard label="Cancelled"    value={counts.cancelled ?? 0}    color="bg-red-50 text-red-800" />
        </div>

        {/* ── Search + Filter ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, name, email or item…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {["All", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === s
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading orders…</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Package size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {searchTerm ? "No orders match your search." : "No orders found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const isCancelled = b.status === "Cancelled";
              const isExpanded = expanded.includes(b.id);

              return (
                <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  {/* ── Card Header ── */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">{b.customerName}</span>
                        <StatusBadge status={b.status} />
                        <PaymentBadge status={b.paymentStatus} />
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">{b.orderId}</p>
                      <p className="text-xs text-slate-400">{b.email} · {b.date}</p>
                      <p className="text-sm font-bold text-slate-800">
                        ₹{Number(b.finalAmount).toLocaleString("en-IN")}
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          ({b.watches.length} item{b.watches.length !== 1 ? "s" : ""} · {b.paymentMethod})
                        </span>
                      </p>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Status dropdown */}
                      <select
                        value={b.status}
                        onChange={(e) => {
                          if (isCancelled) return;
                          setPendingStatus({ id: b.id, newStatus: e.target.value });
                        }}
                        disabled={isCancelled}
                        className={`text-sm px-3 py-2 rounded-xl border outline-none transition cursor-pointer font-semibold
                          ${STATUS_COLORS[b.status] || STATUS_COLORS.default}
                          ${isCancelled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      {/* Delete */}
                      <button
                        onClick={() => setPendingDelete(b.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-full transition"
                        title="Delete order"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Expand */}
                      <button
                        onClick={() => toggle(b.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded Details ── */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 sm:px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                      {/* Customer info */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <User size={13} /> Customer Details
                        </h4>
                        <InfoRow icon={<Phone size={14} />} label="Phone" value={b.phone} />
                        <InfoRow icon={<MapPin size={14} />} label="Address" value={b.address} />
                        <InfoRow icon={<Calendar size={14} />} label="Order Date" value={b.date} />
                        <InfoRow icon={<CreditCard size={14} />} label="Payment" value={`${b.paymentMethod} · ${b.paymentStatus}`} />
                        {b.notes && (
                          <InfoRow icon={<MessageSquare size={14} />} label="Notes" value={b.notes} />
                        )}
                      </div>

                      {/* Items + totals */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <Watch size={13} /> Items Ordered
                        </h4>
                        <div className="space-y-3">
                          {b.watches.map((w, i) => (
                            <div key={i} className="flex gap-3 items-center bg-white rounded-xl p-3 border border-slate-100">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                                {w.img ? (
                                  <img
                                    src={w.img}
                                    alt={w.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No img</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-sm truncate">{w.name}</p>
                                <p className="text-xs text-slate-400">Qty: {w.qty}</p>
                              </div>
                              <p className="font-bold text-slate-800 text-sm shrink-0">
                                ₹{(w.price * w.qty).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Price summary */}
                        <div className="mt-4 bg-white rounded-xl border border-slate-100 p-3 space-y-1.5 text-sm">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{Number(b.totalAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Tax (8%)</span>
                            <span>₹{Number(b.taxAmount).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Shipping</span>
                            <span>Free</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                            <span>Total</span>
                            <span>₹{Number(b.finalAmount).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Status Confirm Dialog ── */}
      {pendingStatus && (
        <ConfirmDialog
          title="Update Order Status?"
          message={`Change order status to "${pendingStatus.newStatus}"? ${
            pendingStatus.newStatus === "Cancelled"
              ? "This cannot be undone — the customer will be notified."
              : "The customer will be notified by email."
          }`}
          confirmLabel={`Set to ${pendingStatus.newStatus}`}
          confirmClass={
            pendingStatus.newStatus === "Cancelled"
              ? "bg-red-500 hover:bg-red-600 shadow-red-100"
              : "bg-slate-900 hover:bg-slate-800 shadow-slate-200"
          }
          onConfirm={confirmStatusUpdate}
          onCancel={() => setPendingStatus(null)}
        />
      )}

      {/* ── Delete Confirm Dialog ── */}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this booking?"
          message="This will permanently remove the order. This action cannot be undone."
          confirmLabel="Delete"
          confirmClass="bg-red-500 hover:bg-red-600 shadow-red-100"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default ManageBooking;