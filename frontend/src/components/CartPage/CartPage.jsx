// src/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import {
  Plus, Minus, Trash2, ArrowLeft, ShoppingBag,
  ChevronRight, CheckCircle2, RefreshCw,
  MapPin, Phone, Mail, CreditCard, FileText, User,
} from "lucide-react";
import { useCart } from "../../CartContext";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;
  if (raw.startsWith("/")) return `${baseHost}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  return raw;
}

const STEPS = ["Cart", "Details", "Review", "Placed"];

function StepBar({ step }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((label, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < step ? "bg-slate-900 text-white" :
              i === step ? "bg-slate-900 text-white ring-4 ring-slate-200" :
              "bg-slate-100 text-slate-400"
            }`}>
              {i < step ? <CheckCircle2 size={16} /> : i + 1}
            </div>
            <span className={`text-[11px] font-semibold ${i <= step ? "text-slate-700" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-all ${i < step ? "bg-slate-900" : "bg-slate-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function CartItem({ item }) {
  const { increment, decrement, removeItem } = useCart();
  const [localQty, setLocalQty] = useState(Number(item.qty ?? 1));

  useEffect(() => { setLocalQty(Number(item.qty ?? item.quantity ?? 1)); }, [item.qty, item.quantity]);

  return (
    <div className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        <img
          src={normalizeImageUrl(item.img)}
          alt={item.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => { e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3C/svg%3E"; }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h3>
        <p className="text-slate-500 text-sm font-medium mt-0.5">₹{Number(item.price).toLocaleString("en-IN")}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="inline-flex items-center gap-2 border border-slate-200 rounded-full px-3 py-1 bg-white">
            <button onClick={() => { if (localQty <= 1) removeItem(item.id); else { setLocalQty(q => q - 1); decrement(item.id); } }}
              className="text-slate-500 hover:text-slate-900 transition">
              <Minus size={13} />
            </button>
            <span className="text-sm font-bold w-4 text-center">{localQty}</span>
            <button onClick={() => { setLocalQty(q => q + 1); increment(item.id); }}
              className="text-slate-500 hover:text-slate-900 transition">
              <Plus size={13} />
            </button>
          </div>
          <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="text-sm font-bold text-slate-900 shrink-0">
        ₹{(Number(item.price) * localQty).toLocaleString("en-IN")}
      </div>
    </div>
  );
}

function OrderSummary({ cart, totalPrice }) {
  const tax = totalPrice * 0.08;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-6">
      <h2 className="font-bold text-slate-900 mb-4">Order Summary</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
          <span>₹{totalPrice.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Shipping</span>
          <span className="text-green-600 font-semibold">Free</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tax (8%)</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-900 text-base pt-3 border-t border-slate-100 mt-3">
          <span>Total</span>
          <span>₹{(totalPrice + tax).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        {Icon && <Icon size={12} />} {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none transition placeholder:text-slate-300";

export default function CartPage() {
  const { cart, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", address: "", note: "", paymentMethod: "" });
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const isFormValid = () => {
    const { name, email, mobile, address, paymentMethod } = form;
    if (!name.trim() || !email.trim() || !mobile.trim() || !address.trim() || !paymentMethod) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!/^\d{10}$/.test(mobile.replace(/\s/g, ""))) return false;
    return true;
  };

  const submitOrder = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) { toast.error("Please log in to place an order."); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phoneNumber: form.mobile,
        address: form.address,
        notes: form.note,
        paymentMethod: form.paymentMethod,
        items: cart.map((it) => ({
          productId: it.productId ?? it.id,
          name: it.name,
          img: normalizeImageUrl(it.img),
          price: Number(it.price ?? 0),
          qty: Number(it.qty ?? it.quantity ?? 1),
          description: it.description ?? "",
        })),
      };

      const res = await axios.post(`${API_BASE}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success) {
        const checkoutUrl = res.data.checkoutUrl ?? null;
        if (checkoutUrl) {
          clearCart();
          window.location.href = checkoutUrl;
          return;
        }
        setPlacedOrder(res.data.order);
        clearCart();
        setStep(3);
        return;
      }
      toast.error(res?.data?.message ?? "Failed to create order.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) toast.error("Session expired — please log in again.");
      else toast.error(err?.response?.data?.message ?? "Failed to place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 0: Cart ───────────────────────────────────────────────────────
  if (step === 0) {
    if (!cart.length) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <ShoppingBag size={56} className="mx-auto text-slate-300" />
            <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
            <p className="text-slate-400 text-sm">Add some watches to get started.</p>
            <Link to="/watches" className="inline-block mt-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition">
              Browse Watches
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <ToastContainer />
        <div className="max-w-4xl mx-auto">
          <Link to="/watches" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition w-fit">
            <ArrowLeft size={16} /> Back to Watches
          </Link>
          <StepBar step={0} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-bold text-slate-900 mb-2">Your Cart</h2>
              <div>{cart.map((item) => <CartItem key={item.id} item={item} />)}</div>
            </div>
            <div className="space-y-4">
              <OrderSummary cart={cart} totalPrice={totalPrice} />
              <button
                onClick={() => setStep(1)}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                Proceed to Details <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Details ────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <ToastContainer />
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setStep(0)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition">
            <ArrowLeft size={16} /> Back
          </button>
          <StepBar step={1} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="font-bold text-slate-900">Delivery Details</h2>
                <p className="text-slate-400 text-sm mt-0.5">All fields marked * are required</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={User} label="Full Name" required>
                  <input value={form.name} onChange={setField("name")} placeholder="John Doe" className={inputCls} />
                </Field>
                <Field icon={Mail} label="Email" required>
                  <input type="email" value={form.email} onChange={setField("email")} placeholder="john@example.com" className={inputCls} />
                </Field>
              </div>

              <Field icon={Phone} label="Mobile Number" required>
                <input
                  value={form.mobile}
                  onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                  className={inputCls}
                />
              </Field>

              <Field icon={MapPin} label="Delivery Address" required>
                <textarea value={form.address} onChange={setField("address")} rows={3}
                  placeholder="House no., Street, City, State, PIN"
                  className={`${inputCls} resize-none`} />
              </Field>

              <Field icon={CreditCard} label="Payment Method" required>
                <select value={form.paymentMethod} onChange={setField("paymentMethod")} className={inputCls}>
                  <option value="">Select payment method</option>
                  <option value="Online">Online Payment (Stripe)</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </Field>

              <Field icon={FileText} label="Order Notes">
                <textarea value={form.note} onChange={setField("note")} rows={2}
                  placeholder="Special instructions, delivery preferences… (optional)"
                  className={`${inputCls} resize-none`} />
              </Field>
            </div>

            <div className="space-y-4">
              <OrderSummary cart={cart} totalPrice={totalPrice} />
              <button
                onClick={() => {
                  if (!isFormValid()) { toast.error("Please fill all required fields correctly."); return; }
                  setStep(2);
                }}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                Review Order <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Review ─────────────────────────────────────────────────────
  if (step === 2) {
    const tax = totalPrice * 0.08;
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <ToastContainer />
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium mb-6 transition">
            <ArrowLeft size={16} /> Edit Details
          </button>
          <StepBar step={2} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4">Delivery Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "Name",    value: form.name },
                    { label: "Email",   value: form.email },
                    { label: "Mobile",  value: form.mobile },
                    { label: "Payment", value: form.paymentMethod },
                  ].map((r) => (
                    <div key={r.label} className="bg-slate-50 rounded-xl px-4 py-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">{r.label}</div>
                      <div className="font-semibold text-slate-800 mt-0.5">{r.value}</div>
                    </div>
                  ))}
                  <div className="sm:col-span-2 bg-slate-50 rounded-xl px-4 py-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Address</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{form.address}</div>
                  </div>
                  {form.note && (
                    <div className="sm:col-span-2 bg-slate-50 rounded-xl px-4 py-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Notes</div>
                      <div className="text-slate-700 mt-0.5">{form.note}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4">Items ({cart.length})</h3>
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center py-3 border-b border-slate-100 last:border-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={normalizeImageUrl(item.img)} alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">Qty: {item.qty ?? 1}</p>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      ₹{(Number(item.price) * Number(item.qty ?? 1)).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <OrderSummary cart={cart} totalPrice={totalPrice} />

              {form.paymentMethod === "Cash on Delivery" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                  <p className="font-bold text-amber-800 mb-1">Cash on Delivery</p>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Please keep ₹{(totalPrice + tax).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ready at the time of delivery.
                  </p>
                </div>
              )}

              <button
                onClick={submitOrder}
                disabled={submitting}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-60"
              >
                {submitting
                  ? <><RefreshCw size={15} className="animate-spin" /> Processing…</>
                  : <><CheckCircle2 size={15} /> Place Order</>}
              </button>
              <p className="text-center text-xs text-slate-400">
                A confirmation email will be sent to <strong>{form.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Placed ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed!</h2>
          <p className="text-slate-500 text-sm mt-2">
            Thank you, <strong>{placedOrder?.name ?? form.name}</strong>! Your order has been received.
          </p>
        </div>

        {placedOrder && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID</span>
              <span className="font-mono font-bold text-slate-800 text-xs">{placedOrder.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment</span>
              <span className="font-semibold text-slate-800">{placedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total</span>
              <span className="font-bold text-slate-900">₹{Number(placedOrder.finalAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        <p className="text-slate-400 text-xs">
          A confirmation email has been sent to <strong>{placedOrder?.email ?? form.email}</strong>
        </p>

        <div className="flex gap-3">
          <Link to="/my-orders" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition text-center">
            Track Orders
          </Link>
          <Link to="/watches" className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition text-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}