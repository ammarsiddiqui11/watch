// src/pages/WatchDetail/WatchDetail.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingBag, ArrowLeft, Loader2, Minus, Plus,
  ChevronLeft, ChevronRight, Shield, RefreshCw,
  Truck, Star, Heart, Share2, ShoppingCart,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext.jsx";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

const TRUST_BADGES = [
  { icon: Truck,    label: "Free Shipping",     sub: "On all orders" },
  { icon: Shield,   label: "2-Year Warranty",   sub: "Manufacturer backed" },
  { icon: RefreshCw, label: "Easy Returns",     sub: "30-day policy" },
];

// ── Thumbnail Strip ───────────────────────────────────────────────────────
function ThumbnailStrip({ images, current, onSelect }) {
  if (images.length <= 1) return null;
  return (
    <div className="flex gap-2 mt-4 justify-center flex-wrap">
      {images.map((img, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
            i === current ? "border-slate-900 shadow-md" : "border-slate-200 hover:border-slate-400"
          }`}
        >
          <img src={normalizeImageUrl(img)} alt={`thumb-${i}`} className="w-full h-full object-contain p-1"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </button>
      ))}
    </div>
  );
}

// ── Related Watch Card ────────────────────────────────────────────────────
function RelatedCard({ item, onAdd, qty, onInc, onDec, onRemove }) {
  const [imgErr, setImgErr] = useState(false);
  const img = normalizeImageUrl(
    (Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? ""
  );
  const sid = String(item._id ?? item.id);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <Link to={`/watches/${sid}`} className="aspect-square bg-slate-50 overflow-hidden block">
        {!imgErr && img ? (
          <img src={img} alt={item.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No image</div>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/watches/${sid}`} className="flex-1">
          <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">{item.name}</h4>
          <p className="text-xs font-semibold text-slate-700 mt-1">₹{Number(item.price).toLocaleString("en-IN")}</p>
        </Link>
        <div className="mt-2">
          {qty > 0 ? (
            <div className="flex items-center justify-between bg-slate-900 rounded-full px-2 py-1">
              <button onClick={() => qty <= 1 ? onRemove(sid) : onDec(sid)} className="text-white hover:opacity-70 transition w-5 h-5 flex items-center justify-center">
                <Minus size={10} />
              </button>
              <span className="text-white text-xs font-bold">{qty}</span>
              <button onClick={() => onInc(sid)} className="text-white hover:opacity-70 transition w-5 h-5 flex items-center justify-center">
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd({ id: sid, name: item.name, price: item.price, img })}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold py-1.5 rounded-full transition-colors"
            >
              <ShoppingCart size={10} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
const WatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [related, setRelated] = useState([]);

  const { cart, addItem, increment, decrement, removeItem } = useCart();

  const getQty = useCallback((sid) => {
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];
    const m = items.find((c) => [c.productId, c.id, c._id].some((f) => String(f ?? "") === String(sid)));
    return Number(m?.qty ?? m?.quantity ?? 0) || 0;
  }, [cart]);

  useEffect(() => {
    setCurrentImgIndex(0);
    setWatch(null);
    setLoading(true);
    let active = true;

    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/watches/${id}`);
        if (!active) return;
        if (data.success) {
          setWatch(data.data);
          // Fetch related (same category)
          try {
            const rel = await axios.get(`${API_BASE}/api/watches?limit=6`);
            const items = Array.isArray(rel.data?.items) ? rel.data.items : [];
            setRelated(items.filter((w) => String(w._id ?? w.id) !== id).slice(0, 5));
          } catch (_) {}
        } else {
          toast.error("Watch not found.");
        }
      } catch {
        toast.error("Could not load watch details.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin" />
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xl font-bold text-slate-800">Watch not found</p>
          <button onClick={() => navigate(-1)} className="text-sm text-slate-500 underline">Go back</button>
        </div>
      </div>
    );
  }

  const sid = String(watch._id ?? watch.id ?? id);
  const qty = getQty(sid);

  const images = watch.images?.length ? watch.images
    : Array.isArray(watch.image) && watch.image.length ? watch.image
    : watch.img ? [watch.img] : [];

  const currentImg = normalizeImageUrl(images[currentImgIndex] ?? "");

  const handleAddToCart = () => {
    addItem({ id: sid, name: watch.name, price: watch.price, img: normalizeImageUrl(images[0] ?? "") });
    toast.success(`${watch.name} added to cart!`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.info("Link copied to clipboard!");
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="min-h-screen bg-slate-50">
        {/* Back bar */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-8 lg:px-16 py-4">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-semibold transition-colors w-fit">
            <ArrowLeft size={16} /> Back to Collection
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* ── Left: Images ── */}
            <div className="lg:sticky lg:top-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 relative">
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImgIndex((p) => (p === 0 ? images.length - 1 : p - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-slate-50 transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentImgIndex((p) => (p === images.length - 1 ? 0 : p + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-slate-50 transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <img
                  src={currentImg}
                  alt={`${watch.name} — view ${currentImgIndex + 1}`}
                  className="w-full h-80 sm:h-96 lg:h-[440px] object-contain transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E";
                  }}
                />

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImgIndex(i)}
                        className={`rounded-full transition-all ${i === currentImgIndex ? "bg-slate-900 w-4 h-1.5" : "bg-slate-300 w-1.5 h-1.5"}`}
                      />
                    ))}
                  </div>
                )}

                <ThumbnailStrip images={images} current={currentImgIndex} onSelect={setCurrentImgIndex} />
              </div>
            </div>

            {/* ── Right: Info ── */}
            <div className="space-y-6">
              {/* Category + actions */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">
                  {watch.category}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setLiked(p => !p)}
                    className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
                    <Heart size={15} className={liked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                  </button>
                  <button onClick={handleShare}
                    className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition">
                    <Share2 size={15} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Name + brand */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">{watch.name}</h1>
                {watch.brandName && (
                  <p className="mt-1.5 text-slate-500 text-sm italic">by {watch.brandName}</p>
                )}
                {/* Mock rating */}
                <div className="flex items-center gap-1.5 mt-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={13} className={s <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">(4.0) · 24 reviews</span>
                </div>
              </div>

              {/* Price */}
              <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Price</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  ₹{watch.price.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-green-600 font-semibold mt-1">Free shipping included</p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Product Details</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{watch.description}</p>
              </div>

              {/* Add to cart CTA */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
                {qty > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center gap-4 bg-slate-900 px-5 py-3 rounded-full shadow-lg">
                      <button aria-label="decrease"
                        onClick={() => { if (qty > 1) decrement(sid); else removeItem(sid); }}
                        className="text-white hover:opacity-70 transition">
                        <Minus size={16} />
                      </button>
                      <span className="text-white font-bold text-lg w-6 text-center">{qty}</span>
                      <button aria-label="increase" onClick={() => increment(sid)}
                        className="text-white hover:opacity-70 transition">
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">in your cart</span>
                  </div>
                ) : (
                  <button onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-700 text-white py-4 rounded-full font-bold text-base shadow-xl shadow-slate-200 transition-all hover:shadow-2xl active:scale-[0.98]">
                    <ShoppingBag size={18} /> Add to Cart
                  </button>
                )}
                <Link to="/cart"
                  className="w-full flex items-center justify-center gap-2 border-2 border-slate-900 text-slate-900 py-3.5 rounded-full font-bold text-sm hover:bg-slate-900 hover:text-white transition-all">
                  View Cart
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                    <Icon size={16} className="mx-auto text-slate-600 mb-1.5" />
                    <p className="text-[11px] font-bold text-slate-800">{label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── You Might Also Like ── */}
          {related.length > 0 && (
            <div className="mt-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Discover More</p>
                  <h2 className="text-2xl font-bold text-slate-900">You Might Also Like</h2>
                </div>
                <Link to="/watches" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {related.map((item) => {
                  const rsid = String(item._id ?? item.id);
                  return (
                    <RelatedCard
                      key={rsid} item={item} qty={getQty(rsid)}
                      onAdd={addItem} onInc={increment} onDec={decrement} onRemove={removeItem}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WatchDetail;