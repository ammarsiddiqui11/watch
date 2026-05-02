// src/pages/Brand/BrandPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, ShoppingCart, Minus, Plus,
  Search, X, Heart, SlidersHorizontal,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  if (raw.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
    try { const u = new URL(raw); u.protocol = "https:"; return u.toString(); } catch (_) {}
  }
  return raw;
}

const SORT_OPTIONS = [
  { value: "default",    label: "Default" },
  { value: "price-asc",  label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc",   label: "A → Z" },
];

// ── Skeleton Card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 animate-pulse">
      <div className="aspect-square bg-slate-100 dark:bg-slate-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full" />
        <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded-full mt-3" />
      </div>
    </div>
  );
}

// ── Watch Card ────────────────────────────────────────────────────────────
function WatchCard({ w, qty, onAdd, onInc, onDec, onRemove }) {
  const [imgErr, setImgErr] = useState(false);
  const [liked, setLiked] = useState(false);
  const sid = String(w.id);

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl dark:hover:shadow-slate-900/50 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <Link to={`/watches/${sid}`}>
          {!imgErr && w.img ? (
            <img
              src={w.img} alt={w.name} draggable={false}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">
              No image
            </div>
          )}
        </Link>

        <button
          onClick={() => setLiked((p) => !p)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={13} className={liked ? "fill-red-500 text-red-500" : "text-slate-400"} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/watches/${sid}`} className="flex-1 block">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
            {w.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {w.desc}
          </p>
        </Link>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            ₹{Number(w.price).toLocaleString("en-IN")}
          </span>

          {qty > 0 ? (
            <div className="flex items-center gap-1 bg-slate-900 dark:bg-white rounded-full px-2 py-1">
              <button
                onClick={() => qty <= 1 ? onRemove(sid) : onDec(sid)}
                className="w-5 h-5 flex items-center justify-center text-white dark:text-slate-900 hover:opacity-70 transition"
              >
                <Minus size={10} />
              </button>
              <span className="text-white dark:text-slate-900 text-xs font-bold w-4 text-center">{qty}</span>
              <button
                onClick={() => onInc(sid)}
                className="w-5 h-5 flex items-center justify-center text-white dark:text-slate-900 hover:opacity-70 transition"
              >
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd({ id: sid, name: w.name, price: w.price, img: w.img })}
              className="flex items-center gap-1.5 bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-3 py-2 rounded-full transition-colors"
            >
              <ShoppingCart size={11} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function BrandPage() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const { cart, addItem, increment, decrement, removeItem } = useCart();

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  const mapItem = useCallback((item) => ({
    id: item._id ?? item.id ?? String(Math.random()),
    name: item.name ?? "",
    price: item.price ?? 0,
    brand: item.brandName ?? "",
    desc: item.description ?? item.desc ?? "",
    img: normalizeImageUrl(
      (Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? ""
    ),
  }), []);

  useEffect(() => { window.scrollTo(0, 0); }, [brandName]);

  useEffect(() => {
    if (!brandName) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/watches/brands/${encodeURIComponent(brandName)}`
        );
        const items = data?.items ?? data ?? [];
        if (active) setWatches(items.map(mapItem));
      } catch {
        if (active) toast.error("Could not fetch watches for this brand.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [brandName, mapItem]);

  const getQty = useCallback((id) => {
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];
    const m = items.find((c) =>
      [c.productId, c.id, c._id].some((f) => String(f ?? "") === String(id))
    );
    return Number(m?.qty ?? m?.quantity ?? 0) || 0;
  }, [cart]);

  const displayed = React.useMemo(() => {
    let list = watches;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((w) =>
        w.name.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name-asc")   return a.name.localeCompare(b.name);
      return 0;
    });
  }, [watches, search, sort]);

  // Pretty-print brand name (slugs like "audemars-piguet" → "Audemars Piguet")
  const prettyBrand = brandName
    ?.split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") ?? "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 lg:px-16 pt-8 pb-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold mb-5 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Brand Collection</p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {prettyBrand}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400 dark:from-slate-300 dark:to-slate-500">
              Collection
            </span>
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm max-w-lg">
            Exploring the finest timepieces from {prettyBrand}.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in this brand…"
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 w-52 transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  <X size={12} />
                </button>
              )}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 outline-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {!loading && (
            <p className="mt-3 text-[11px] text-slate-400 font-semibold">
              {displayed.length} {displayed.length === 1 ? "watch" : "watches"}
              {search && ` matching "${search}"`}
            </p>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search size={20} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {search
                ? `No results for "${search}" in ${prettyBrand}`
                : `No watches found for ${prettyBrand}.`
              }
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs font-bold text-slate-900 dark:text-white underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {displayed.map((w) => (
              <WatchCard
                key={w.id} w={w} qty={getQty(String(w.id))}
                onAdd={addItem} onInc={increment} onDec={decrement} onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}