// src/pages/MyOrders/MyOrders.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Package, RefreshCw, ChevronDown, ChevronUp,
  CreditCard, MapPin, Phone, Clock, CheckCircle2,
  XCircle, Truck, AlertCircle, ShoppingBag,
} from "lucide-react";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

const STATUS_CONFIG = {
  Pending:   { icon: Clock,         color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-200", label: "Pending",   desc: "We've received your order and are reviewing it." },
  Confirmed: { icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200",  label: "Confirmed", desc: "Your order is confirmed and being prepared." },
  Completed: { icon: CheckCircle2,  color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   label: "Completed", desc: "Your order has been delivered successfully." },
  Cancelled: { icon: XCircle,       color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",    label: "Cancelled", desc: "This order has been cancelled." },
  Shipped:   { icon: Truck,         color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-200", label: "Shipped",   desc: "Your order is on its way!" },
};

// ── Status Timeline ────────────────────────────────────────────────────────
const TIMELINE_STEPS = ["Pending", "Confirmed", "Shipped", "Completed"];

function StatusTimeline({ status }) {
  if (status === "Cancelled") {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold">
        <XCircle size={16} /> This order was cancelled
      </div>
    );
  }

  const currentIdx = TIMELINE_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {TIMELINE_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.Pending;
        const Icon = cfg.icon;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                <Icon size={14} />
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight ${done ? "text-slate-800" : "text-slate-400"}`}>
                {s}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-4 transition-all ${i < currentIdx ? "bg-slate-900" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.Pending;
  const StatusIcon = cfg.icon;

  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${cfg.border}`}>
      {/* Status strip */}
      <div className={`px-5 py-2.5 flex items-center gap-2 text-sm font-semibold ${cfg.bg} ${cfg.color} border-b ${cfg.border}`}>
        <StatusIcon size={15} />
        {cfg.label}
        <span className="ml-auto text-xs font-normal text-slate-500">{date}</span>
      </div>

      {/* Card header */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-slate-400">{order.orderId}</p>
            <p className="font-bold text-slate-900 mt-0.5">
              ₹{Number(order.finalAmount).toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-400 ml-2">
                {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · {order.paymentMethod}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${
              order.paymentStatus === "Paid"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {order.paymentStatus}
            </span>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? "Hide" : "Details"}
            </button>
          </div>
        </div>

        {/* Timeline */}
        <StatusTimeline status={order.orderStatus} />

        {/* Status description */}
        <p className="text-xs text-slate-500 italic">{cfg.desc}</p>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-5 space-y-5">
          {/* Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Items Ordered</h4>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex gap-3 items-center bg-white rounded-xl p-3 border border-slate-100">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    {item.img ? (
                      <img src={normalizeImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">Qty: {item.qty}</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">
                    ₹{(item.price * item.qty).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery + Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Delivery Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>{order.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{order.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <CreditCard size={14} className="text-slate-400" />
                  <span>{order.paymentMethod}</span>
                </div>
                {order.notes && (
                  <p className="text-slate-500 italic text-xs pl-1">"{order.notes}"</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Price Breakdown</h4>
              <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax</span><span>₹{Number(order.taxAmount).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-slate-500"><span>Shipping</span><span className="text-green-600 font-semibold">Free</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total</span><span>₹{Number(order.finalAmount).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please log in to view your orders.");
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const displayed = filter === "All" ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
            <p className="text-slate-400 text-sm mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
          </div>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition bg-white shadow-sm">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {["All", ...Object.keys(STATUS_CONFIG)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                filter === s ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
              {s !== "All" && (
                <span className="ml-1.5 opacity-60">
                  {orders.filter((o) => o.orderStatus === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading your orders…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertCircle size={40} className="text-slate-300" />
            <p className="text-slate-500 text-sm">{error}</p>
            {error.includes("log in") && (
              <Link to="/login" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
                Log In
              </Link>
            )}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ShoppingBag size={40} className="text-slate-300" strokeWidth={1.5} />
            <p className="text-slate-500 text-sm">
              {filter === "All" ? "You haven't placed any orders yet." : `No ${filter.toLowerCase()} orders.`}
            </p>
            <Link to="/watches" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition">
              Shop Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}