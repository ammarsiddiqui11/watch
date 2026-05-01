// src/pages/WatchPage/WatchPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { LayoutGrid, User, Users, ShoppingCart, Minus, Plus, Search, X, Heart, SlidersHorizontal } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCart } from "../../CartContext.jsx";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

const FILTERS = [
  { key: "all", label: "All", icon: LayoutGrid },
  { key: "men", label: "Men", icon: User },
  { key: "women", label: "Women", icon: Users },
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price-asc",  label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "name-asc",   label: "A → Z" },
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-8 bg-slate-100 rounded-full mt-3" />
      </div>
    </div>
  );
}

function WatchCard({ w, qty, onAdd, onInc, onDec, onRemove }) {
  const [imgErr, setImgErr] = useState(false);
  const [liked, setLiked] = useState(false);
  const sid = String(w.id);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        <Link to={`/watches/${sid}`}>
          {!imgErr && w.img ? (
            <img
              src={w.img} alt={w.name} draggable={false}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No image</div>
          )}
        </Link>
        <button
          onClick={() => setLiked(p => !p)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={13} className={liked ? "fill-red-500 text-red-500" : "text-slate-400"} />
        </button>
        <span className="absolute top-3 left-3 bg-white/90 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shadow-sm">
          {w.category || "watch"}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/watches/${sid}`} className="flex-1 block">
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{w.name}</h3>
          {w.brand && <p className="text-xs text-slate-400 mt-0.5 italic">{w.brand}</p>}
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{w.desc}</p>
        </Link>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <span className="font-bold text-slate-900 text-sm">₹{Number(w.price).toLocaleString("en-IN")}</span>
          {qty > 0 ? (
            <div className="flex items-center gap-1 bg-slate-900 rounded-full px-2 py-1">
              <button onClick={() => qty <= 1 ? onRemove(sid) : onDec(sid)}
                className="w-5 h-5 flex items-center justify-center text-white hover:opacity-70 transition">
                <Minus size={10} />
              </button>
              <span className="text-white text-xs font-bold w-4 text-center">{qty}</span>
              <button onClick={() => onInc(sid)}
                className="w-5 h-5 flex items-center justify-center text-white hover:opacity-70 transition">
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd({ id: sid, name: w.name, price: w.price, img: w.img })}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-full transition-colors"
            >
              <ShoppingCart size={11} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WatchPage() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const { cart, addItem, increment, decrement, removeItem } = useCart();
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapItem = useCallback((item) => {
    const img = normalizeImageUrl(
      (Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? ""
    );
    const raw = String(item.gender ?? item.category ?? "").toLowerCase();
    const gender = raw === "men" || raw === "male" ? "men"
      : raw === "women" || raw === "female" ? "women" : "unisex";
    return {
      id: item._id ?? item.id ?? String(Math.random()),
      name: item.name ?? "",
      price: item.price ?? 0,
      category: item.category ?? "",
      brand: item.brandName ?? "",
      desc: item.description ?? item.desc ?? "",
      img, gender,
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/api/watches?limit=10000`);
        const items = Array.isArray(data) ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.watches) ? data.watches : [];
        if (active) setWatches(items.map(mapItem));
      } catch { if (active) toast.error("Could not load watches."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [mapItem]);

  const getQty = useCallback((id) => {
    const items = Array.isArray(cart) ? cart : cart?.items ?? [];
    const m = items.find((c) => [c.productId, c.id, c._id].some((f) => String(f ?? "") === id));
    return Number(m?.qty ?? m?.quantity ?? 0) || 0;
  }, [cart]);

  const displayed = useMemo(() => {
    let list = filter === "all" ? watches : watches.filter((w) => w.gender === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((w) =>
        w.name.toLowerCase().includes(q) || w.brand.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name-asc")   return a.name.localeCompare(b.name);
      return 0;
    });
  }, [watches, filter, search, sort]);

  return (
    <div className="min-h-screen bg-slate-50">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 lg:px-16 pt-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Collection</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Timepieces <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-400">Curated</span>
          </h1>
          <p className="mt-2 text-slate-500 text-sm max-w-lg">A handpicked selection of premium watches for every occasion.</p>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search watches, brands…"
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-white w-56 transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              {FILTERS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    filter === key ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                  }`}>
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none">
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

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <Search size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {search ? `No results for "${search}"` : "No watches found."}
            </p>
            {search && <button onClick={() => setSearch("")} className="text-xs font-bold text-slate-900 underline">Clear search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {displayed.map((w) => (
              <WatchCard key={w.id} w={w} qty={getQty(String(w.id))}
                onAdd={addItem} onInc={increment} onDec={decrement} onRemove={removeItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}