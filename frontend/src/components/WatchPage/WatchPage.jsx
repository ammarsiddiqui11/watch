// src/pages/WatchPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Grid, User, Users, ShoppingCart, Minus, Plus } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext.jsx"; // adjust path if needed
import { WATCHES as DUMMY_WATCHES, FILTERS as RAW_FILTERS } from "./dummydata";
import { watchPageStyles } from "../../assets/dummyStyles";
import { Link } from "react-router-dom"; //

const ICON_MAP = { Grid, User, Users };
const FILTERS = RAW_FILTERS?.length
  ? RAW_FILTERS.map((f) => ({ ...f, icon: ICON_MAP[f.iconName] ?? Grid }))
  : [
      { key: "all", label: "All", icon: Grid },
      { key: "men", label: "Men", icon: User },
      { key: "women", label: "Women", icon: Users },
    ];

// Production API host (used to normalize/compose image URLs)
const API_BASE = "http://localhost:4000";

// ------------------------ helper ------------------------
function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";

  // derive baseHost for images (strip possible /api suffix)
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;

  // Relative path -> prefix with baseHost
  if (raw.startsWith("/")) {
    return `${baseHost}${raw}`;
  }

  // Replace localhost/127.0.0.1 with production host
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }

  // If frontend is served over https and raw is http, try upgrading to https (avoid mixed content)
  if (raw.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    try {
      const u = new URL(raw);
      u.protocol = "https:";
      return u.toString();
    } catch (e) {
      // fallback to raw
    }
  }

  return raw;
}
// --------------------------------------------------------

export default function WatchPage() {
  const [filter, setFilter] = useState("all");
  const { cart, addItem, increment, decrement, removeItem } = useCart();

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // normalize server item -> UI shape
  const mapServerToUI = (item) => {
    let img = item.image ?? item.img ?? "";
    // normalize image url (handles /uploads, localhost, http->https upgrade)
    img = normalizeImageUrl(img);

    const rawGender =
      (item.gender && String(item.gender).toLowerCase()) ||
      (item.category && String(item.category).toLowerCase()) ||
      "";

    const gender =
      rawGender === "men" || rawGender === "male"
        ? "men"
        : rawGender === "women" || rawGender === "female"
        ? "women"
        : "unisex";

    return {
      id:
        item._id ??
        item.id ??
        String(item.sku ?? item.name ?? Math.random()).slice(2, 12),
      name: item.name ?? "",
      price: item.price ?? 0,
      category: item.category ?? "",
      brand: item.brandName ?? "",
      // match render usage (w.desc)
      desc: item.description ?? item.desc ?? "",
      img,
      gender,
      raw: item,
    };
  };

  // fetch watches from backend, fallback to dummy data if available
  useEffect(() => {
    let mounted = true;
    const fetchWatches = async () => {
      setLoading(true);
      try {
        // Request a high limit so backend returns all items.
        const resp = await axios.get(`${API_BASE}/api/watches?limit=10000`);
        const data = resp.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.watches)
          ? data.watches
          : null;

        if (!items) {
          if (mounted) {
            if (Array.isArray(DUMMY_WATCHES) && DUMMY_WATCHES.length) {
              setWatches(DUMMY_WATCHES.map(mapServerToUI));
              toast.info("Using local dummy watches.");
            } else {
              setWatches([]);
              toast.info("No watches returned from server.");
            }
          }
        } else if (mounted) {
          setWatches(items.map(mapServerToUI));
        }
      } catch (err) {
        console.error("Failed to fetch watches:", err);
        if (mounted) {
          if (Array.isArray(DUMMY_WATCHES) && DUMMY_WATCHES.length) {
            setWatches(DUMMY_WATCHES.map(mapServerToUI));
            toast.warn("Could not reach server — using local dummy watches.");
          } else {
            setWatches([]);
            toast.error("Could not fetch watches from server.");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWatches();
    return () => {
      mounted = false;
    };
  }, []); // run once

  // helper: find qty in cart for a product id (robust to different shapes)
  const getQty = (id) => {
    // cart might be an array or an object with items; normalize to array
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];

    const match = items.find((c) => {
      const candidates = [c.productId, c.id, c._id];
      return candidates.some((field) => String(field ?? "") === String(id));
    });

    if (!match) return 0;
    const qty = match.qty ?? match.quantity ?? 0;
    return Number(qty) || 0;
  };

  const filtered = useMemo(
    () =>
      watches.filter((w) =>
        filter === "all"
          ? true
          : filter === "men"
          ? w.gender === "men"
          : filter === "women"
          ? w.gender === "women"
          : true
      ),
    [filter, watches]
  );

  return (
    <div className={watchPageStyles.container}>
      <ToastContainer />
      <div className={watchPageStyles.headerContainer}>
        <div>
          <h1 className={watchPageStyles.headerTitle}>
            Timepieces{" "}
            <span className={watchPageStyles.titleAccent}>
              Curated
            </span>
          </h1>
          <p className={watchPageStyles.headerDescription}>
            A handpicked selection — clean presentation, zero borders. Choose a
            filter to refine.
          </p>
        </div>

        <div className={watchPageStyles.filterContainer}>
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`${watchPageStyles.filterButtonBase} ${
                  active
                    ? watchPageStyles.filterButtonActive
                    : watchPageStyles.filterButtonInactive
                }`}
              >
                <Icon className={watchPageStyles.filterIcon} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className={watchPageStyles.loadingText}>Loading watches…</div>
      ) : filtered.length === 0 ? (
        <div className={watchPageStyles.noWatchesText}>No watches found.</div>
      ) : (
        <div className={watchPageStyles.grid}>
          {filtered.map((w) => {
            const sid = String(w.id ?? w._id ?? w.sku ?? w.name);
            const qty = getQty(sid);

            return (
              <div key={sid} className={watchPageStyles.card}>
                <div className={watchPageStyles.imageContainer}>
                  <Link to={`/watches/${sid}`}>
                  <img
                    src={w.img}
                    alt={w.name}
                    className={watchPageStyles.image}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.style.objectFit = "contain";
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  </Link>

                  <div className={watchPageStyles.cartControlsContainer}>
                    {qty > 0 ? (
                      <div className={watchPageStyles.cartQuantityControls}>
                        <button
                          aria-label={`decrease ${w.name}`}
                          onClick={() => {
                            if (qty > 1) decrement(sid);
                            else removeItem(sid);
                          }}
                          className={watchPageStyles.quantityButton}
                        >
                          <Minus className={watchPageStyles.quantityIcon} />
                        </button>

                        <div className={watchPageStyles.cartQuantity}>
                          {qty}
                        </div>

                        <button
                          aria-label={`increase ${w.name}`}
                          onClick={() => increment(sid)}
                          className={watchPageStyles.quantityButton}
                        >
                          <Plus className={watchPageStyles.quantityIcon} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          addItem({
                            id: sid,
                            name: w.name,
                            price: w.price,
                            img: normalizeImageUrl(w.img), // store normalized img in cart
                          })
                        }
                        className={watchPageStyles.addToCartButton}
                      >
                        <ShoppingCart className={watchPageStyles.addToCartIcon} />
                        Add
                      </button>
                    )}
                  </div>
                </div>

                <div className={watchPageStyles.productInfo}>
                  <Link to={`/watches/${sid}`} >
                  <h3 className={watchPageStyles.productName}>{w.name}</h3>
                  </Link>
                  <p className={watchPageStyles.productDescription}>{w.desc}</p>
                  <div className={watchPageStyles.productPrice}>₹{w.price}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
