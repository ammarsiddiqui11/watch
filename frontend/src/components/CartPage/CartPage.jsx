// src/pages/CartPage.jsx
import React, { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "../../CartContext";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { cartPageStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000";

// --- helper: normalize image URLs so deployed frontend doesn't try to reach localhost ---
function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";

  // derive base host for images (strip possible /api suffix)
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;

  // Relative path -> prefix with baseHost
  if (raw.startsWith("/")) {
    return `${baseHost}${raw}`;
  }

  // Replace any localhost or 127.0.0.1 origin with production host
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      baseHost
    );
  }

  // If frontend is served over https and raw is http, try upgrading to https (avoid mixed content)
  if (
    raw.startsWith("http://") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:"
  ) {
    try {
      const u = new URL(raw);
      u.protocol = "https:";
      return u.toString();
    } catch (e) {
      // fallback to raw if parsing fails
    }
  }

  return raw;
}
// --- end helper ---------------------------------------------------------------

function CartProduct({ item }) {
  const { increment, decrement, removeItem } = useCart();
  const [localQty, setLocalQty] = useState(item.qty ?? 1);

  useEffect(() => {
    setLocalQty(Number(item.qty ?? item.quantity ?? 1));
  }, [item.qty, item.quantity]);

  const onInc = () => {
    setLocalQty((q) => (Number.isFinite(q) ? q + 1 : 1));
    increment(item.id);
  };

  const onDec = () => {
    const currentQty = item.qty ?? localQty;
    if (currentQty <= 1) {
      removeItem(item.id);
      return;
    }
    setLocalQty((q) => (Number.isFinite(q) ? q - 1 : currentQty - 1));
    decrement(item.id);
  };

  // normalize when rendering so deployed site doesn't attempt to fetch localhost
  const imgSrc = normalizeImageUrl(item.img);

  return (
    <div className={cartPageStyles.cartItemCard}>
      <div className={cartPageStyles.cartItemImageContainer}>
        <img
          src={imgSrc}
          alt={item.name}
          className={cartPageStyles.cartItemImage}
          onError={(e) => {
            e.currentTarget.style.objectFit = "contain";
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>
      <div className={cartPageStyles.cartItemContent}>
        <h3 className={cartPageStyles.cartItemName}>{item.name}</h3>
        <p className={cartPageStyles.cartItemPrice}>{item.price}</p>

        <div className={cartPageStyles.quantityContainer}>
          <div className={cartPageStyles.quantityControls}>
            <button
              onClick={onDec}
              className={cartPageStyles.quantityButton}
              aria-label={`Decrease ${item.name} quantity`}
            >
              <Minus size={16} />
            </button>

            <span className={cartPageStyles.quantityText}>{localQty}</span>

            <button
              onClick={onInc}
              className={cartPageStyles.quantityButton}
              aria-label={`Increase ${item.name} quantity`}
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.id)}
            className={cartPageStyles.removeButton}
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    cart,
    increment,
    decrement,
    removeItem,
    clearCart,
    totalItems,
    totalPrice,
  } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMobileChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(digitsOnly);
  };

  const isFormValid = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !address.trim() ||
      !mobile.trim() ||
      !paymentMethod.trim()
    )
      return false;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneOk = /^[0-9]{10}$/.test(mobile.replace(/\s+/g, ""));
    return emailOk && phoneOk;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error("Please fill all required fields correctly.", {
        position: "top-right",
      });
      return;
    }
    if (!cart.length) {
      toast.error("Your cart is empty.", { position: "top-right" });
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please log in to place the order.", {
        position: "top-right",
      });
      return;
    }

    const itemsPayload = cart.map((it) => ({
      productId: it.productId ?? it.id,
      name: it.name,
      img: normalizeImageUrl(it.img), // normalize before sending (optional but consistent)
      price: Number(it.price ?? 0),
      qty: Number(it.qty ?? it.quantity ?? 1),
    }));

    const body = {
      name,
      email,
      phoneNumber: mobile,
      address,
      notes: note,
      paymentMethod,
      items: itemsPayload,
    };

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/api/orders`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.success) {
        const checkoutUrl = res.data.checkoutUrl ?? null;
        clearCart();
        if (checkoutUrl) {
          toast.info("Redirecting to payment...", { position: "top-right" });
          window.location.href = checkoutUrl;
          return;
        }
        setName("");
        setEmail("");
        setAddress("");
        setMobile("");
        setNote("");
        setPaymentMethod("");
        toast.success("Order placed successfully.", { position: "top-right" });
        return;
      }

      toast.error(res?.data?.message ?? "Failed to create order", {
        position: "top-right",
      });
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (status === 401) {
        toast.error("Authentication error — please log in again.", {
          position: "top-right",
        });
      } else {
        toast.error(serverMsg ?? "Failed to create order. Try again later.", {
          position: "top-right",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <>
        <ToastContainer />
        <div className={cartPageStyles.emptyCartContainer}>
          <div className={cartPageStyles.emptyCartCard}>
            <ShoppingBag size={48} className={cartPageStyles.emptyCartIcon} />
            <h2 className={cartPageStyles.emptyCartTitle}>
              Your cart is empty
            </h2>
            <p className={cartPageStyles.emptyCartText}>
              Looks like you haven't added any watches to your cart yet.
            </p>
            <Link to="/watches" className={cartPageStyles.emptyCartButton}>
              Browse Watches
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={cartPageStyles.pageContainer}>
        <div className={cartPageStyles.maxWidthContainer}>
          <div className={cartPageStyles.headerContainer}>
            <div className={cartPageStyles.backButtonContainer}>
              <Link
                to="/watches"
                className={cartPageStyles.backLink}
                aria-label="Back to watches"
              >
                <div className={cartPageStyles.backIconContainer}>
                  <ArrowLeft size={20} />
                </div>
                <span className={cartPageStyles.backText}>Back to Watches</span>
              </Link>
            </div>

            <h1 className={cartPageStyles.cartTitle}>Your Shopping Cart</h1>

            <button
              onClick={clearCart}
              className={cartPageStyles.clearCartButton}
              aria-label="Clear cart"
            >
              <Trash2 size={18} /> Clear Cart
            </button>
          </div>

          <div className={cartPageStyles.mainGrid}>
            <div className={cartPageStyles.leftColumn}>
              <div className={cartPageStyles.formContainer}>
                <h2 className={cartPageStyles.formTitle}>Enter your details</h2>
                <p className={cartPageStyles.formSubtitle}>
                  All fields are required.
                </p>

                <form onSubmit={handleSubmit} className={cartPageStyles.form}>
                  <div className={cartPageStyles.inputGrid}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className={cartPageStyles.inputBase}
                      required
                      aria-label="Full name"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className={cartPageStyles.inputBase}
                      required
                      aria-label="Email"
                    />
                  </div>

                  <input
                    type="text"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder="Mobile number (10 digits)"
                    className={cartPageStyles.inputBase}
                    required
                    aria-label="Mobile number"
                  />

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address"
                    rows={3}
                    className={cartPageStyles.textareaBase}
                    required
                    aria-label="Address"
                  />

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={cartPageStyles.selectBase}
                    required
                    aria-label="Payment Method"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Online">Online</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Message / delivery instructions (optional)"
                    rows={2}
                    className={cartPageStyles.textareaBase}
                    aria-label="Message"
                  />

                  <div className={cartPageStyles.formButtonsContainer}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={cartPageStyles.submitButton}
                    >
                      {submitting ? "Processing…" : "Submit Order"}
                    </button>

                    <Link
                      to="/"
                      className={cartPageStyles.continueShoppingButton}
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </form>
              </div>

              <div className={cartPageStyles.cartItemsGrid}>
                {cart.map((item) => (
                  <CartProduct key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className={cartPageStyles.orderSummaryContainer}>
              <h2 className={cartPageStyles.orderSummaryTitle}>
                Order Summary
              </h2>

              <div className={cartPageStyles.orderSummaryContent}>
                <div className={cartPageStyles.summaryRow}>
                  <span className={cartPageStyles.summaryLabel}>
                    Subtotal ({totalItems} items)
                  </span>
                  <span className={cartPageStyles.summaryValue}>
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>

                <div className={cartPageStyles.summaryRow}>
                  <span className={cartPageStyles.summaryLabel}>Shipping</span>
                  <span className={cartPageStyles.summaryValue}>Free</span>
                </div>

                <div className={cartPageStyles.summaryRow}>
                  <span className={cartPageStyles.summaryLabel}>Tax (8%)</span>
                  <span className={cartPageStyles.summaryValue}>
                    ₹{(totalPrice * 0.08).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className={cartPageStyles.totalContainer}>
                <span>Total</span>
                <span>₹{(totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
