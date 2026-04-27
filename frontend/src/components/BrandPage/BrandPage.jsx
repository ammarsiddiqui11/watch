// src/pages/Brand/BrandPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Minus, Plus } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext";
import { watchPageStyles } from "../../assets/dummyStyles"; // Using WatchPage styles for consistency
import Navbar from "../../components/Navbar/Navbar"

const API_BASE = "http://localhost:4000";

// --- helper: normalize image URLs ---
function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;
  if (raw.startsWith("/")) return `${baseHost}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }
  if (raw.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    try {
      const u = new URL(raw);
      u.protocol = "https:";
      return u.toString();
    } catch (e) {}
  }
  return raw;
}

export default function BrandPage() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const { cart, addItem, increment, decrement, removeItem } = useCart();

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize server item -> UI shape (Matching WatchPage logic)
  const mapServerToUI = (item) => {
    let img = (Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? "";
    img = normalizeImageUrl(img);

    return {
      id: item._id ?? item.id ?? String(item.sku ?? item.name ?? Math.random()).slice(2, 12),
      name: item.name ?? "",
      price: item.price ?? 0,
      brand: item.brandName ?? "",
      desc: item.description ?? item.desc ?? "",
      img,
      raw: item,
    };
  };

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [brandName]);

  useEffect(() => {
    if (!brandName) return;

    let mounted = true;
    const fetchBrandWatches = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE}/api/watches/brands/${encodeURIComponent(brandName)}`;
        const resp = await axios.get(url);
        const items = resp?.data?.items ?? resp?.data ?? [];
        
        if (mounted) {
          setWatches(items.map(mapServerToUI));
        }
      } catch (err) {
        console.error("Failed to fetch brand watches:", err);
        if (mounted) toast.error("Could not fetch watches for this brand.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBrandWatches();
    return () => { mounted = false; };
  }, [brandName]);

  // Robust Qty helper from WatchPage
  const getQty = (id) => {
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];
    const match = items.find((c) => {
      const candidates = [c.productId, c.id, c._id];
      return candidates.some((field) => String(field ?? "") === String(id));
    });
    if (!match) return 0;
    return Number(match.qty ?? match.quantity ?? 0) || 0;
  };

  return (
    <>
    <Navbar/>
    
    <div className={watchPageStyles.container}>
      <ToastContainer />
      
      {/* Brand Header Section */}
      <div className={watchPageStyles.headerContainer}>
        <div>
          <button 
            onClick={() => navigate(-1)} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#64748b' }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={watchPageStyles.headerTitle}>
            {brandName}{" "}
            <span className={watchPageStyles.titleAccent}>Collection</span>
          </h1>
          <p className={watchPageStyles.headerDescription}>
            Exploring the finest timepieces from {brandName}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={watchPageStyles.loadingText}>Loading {brandName} watches…</div>
      ) : watches.length === 0 ? (
        <div className={watchPageStyles.noWatchesText}>No watches found for this brand.</div>
      ) : (
        <div className={watchPageStyles.grid}>
          {watches.map((w) => {
            const sid = String(w.id);
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
                          onClick={() => {
                            if (qty > 1) decrement(sid);
                            else removeItem(sid);
                          }}
                          className={watchPageStyles.quantityButton}
                        >
                          <Minus className={watchPageStyles.quantityIcon} />
                        </button>
                        <div className={watchPageStyles.cartQuantity}>{qty}</div>
                        <button
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
                            img: w.img,
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
                  <Link to={`/watches/${sid}`}>
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
    </>
  );
  
}