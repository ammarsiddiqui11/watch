import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext.jsx";
import { watchDetailStyles } from "../../assets/dummyStyles";
import Navbar from "../../components/Navbar/Navbar";
const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";

  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;

  if (raw.startsWith("/")) return `${baseHost}${raw}`;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }

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
      // fallback
    }
  }

  return raw;
}

const WatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const { cart, addItem, increment, decrement, removeItem } = useCart();

  // Derive qty from cart (same logic as WatchPage)
  const getQty = (sid) => {
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];
    const match = items.find((c) => {
      const candidates = [c.productId, c.id, c._id];
      return candidates.some((field) => String(field ?? "") === String(sid));
    });
    if (!match) return 0;
    return Number(match.qty ?? match.quantity ?? 0) || 0;
  };

  useEffect(() => {
    const fetchWatchDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/watches/${id}`);
        if (response.data.success) {
          setWatch(response.data.data);
        } else {
          toast.error("Watch not found.");
        }
      } catch (error) {
        console.error("Error fetching watch details:", error);
        toast.error("Could not load watch details.");
      } finally {
        setLoading(false);
      }
    };
    fetchWatchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="text-center py-20 text-gray-500">Watch not found.</div>
    );
  }

  const sid = String(watch._id ?? watch.id ?? id);
  const qty = getQty(sid);
  const img = normalizeImageUrl(watch.image ?? watch.img ?? "");

  const handleAddToCart = () => {
    addItem({
      id: sid,
      name: watch.name,
      price: watch.price,
      img,
    });
    toast.success(`${watch.name} added to cart!`);
  };

  return (
    <>
    {/* <Navbar /> */}
    
    <div className={watchDetailStyles.container}>
        
      <ToastContainer />

      <button onClick={() => navigate(-1)} className={watchDetailStyles.backBtn}>
        <ArrowLeft size={20} /> Back to Collection
      </button>

      <div className={watchDetailStyles.wrapper}>
        {/* Left: Image */}
        <div className={watchDetailStyles.imageSection}>
          <img
            src={img}
            alt={watch.name}
            className={watchDetailStyles.image}
            onError={(e) => {
              e.currentTarget.style.objectFit = "contain";
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>

        {/* Right: Info */}
        <div className={watchDetailStyles.contentSection}>
          <div>
            <p className={watchDetailStyles.categoryTag}>{watch.category}</p>
            <h1 className={watchDetailStyles.title}>{watch.name}</h1>
            {watch.brandName && (
              <p className={watchDetailStyles.brandName}>By {watch.brandName}</p>
            )}
          </div>

          <p className={watchDetailStyles.price}>
            ₹{watch.price.toLocaleString("en-IN")}
          </p>

          <div className="space-y-2">
            <h3 className={watchDetailStyles.descriptionTitle}>
              Product Details
            </h3>
            <p className={watchDetailStyles.description}>{watch.description}</p>
          </div>

          <div className={watchDetailStyles.actionsContainer}>
            {qty > 0 ? (
              /* Quantity controls — same pattern as WatchPage */
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-3 bg-white border border-gray-200 px-4 py-3 rounded-full shadow">
                  <button
                    aria-label="decrease quantity"
                    onClick={() => {
                      if (qty > 1) decrement(sid);
                      else removeItem(sid);
                    }}
                    className="p-1 rounded cursor-pointer hover:bg-gray-100 transition"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-3 font-semibold text-lg">{qty}</span>
                  <button
                    aria-label="increase quantity"
                    onClick={() => increment(sid)}
                    className="p-1 rounded cursor-pointer hover:bg-gray-100 transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">in your cart</span>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className={watchDetailStyles.addToCartBtn}
              >
                <ShoppingBag size={20} /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
  
};


export default WatchDetail;