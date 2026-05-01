// src/components/ComingSoonWatchesPage/ComingSoonWatchesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const API_BASE = "http://localhost:4000";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

function WatchCard({ watch }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link
      to={`/watches/${watch.id}`}
      className="group flex-shrink-0 w-44 sm:w-52 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="aspect-square bg-slate-50 overflow-hidden">
        {!imgErr && watch.imgUrl ? (
          <img
            src={watch.imgUrl}
            alt={watch.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors">
          {watch.name}
        </h3>
        <p className="text-sm font-bold text-slate-700">
          ₹{Number(watch.price).toLocaleString("en-IN")}
        </p>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-44 sm:w-52 flex flex-col bg-white rounded-2xl border border-slate-100 animate-pulse overflow-hidden">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ComingSoonWatchesPage() {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await axios.get(`${API_BASE}/api/watches?limit=8&sort=-createdAt`);
        const data = resp.data;
        const items = Array.isArray(data) ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.watches) ? data.watches : [];

        if (mounted) {
          setWatches(items.map((item) => ({
            id: item._id ?? item.id,
            name: item.name ?? "",
            price: item.price ?? 0,
            imgUrl: normalizeImageUrl(
              (Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? ""
            ),
          })));
        }
      } catch { /* silently fail */ }
      finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  if (!loading && !watches.length) return null;

  return (
    <section className="bg-white py-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-amber-500" />
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">Just In</p>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              New Arrivals
            </h2>
            <p className="mt-1.5 text-slate-500 text-sm">The latest additions to our collection</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll arrows — visible on all screens */}
            <div className="flex gap-1.5">
              <button
                onClick={() => scroll(-1)}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            </div>
            <Link
              to="/watches"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.new-arrivals-scroll::-webkit-scrollbar { display: none; }`}</style>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : watches.map((w) => <WatchCard key={w.id} watch={w} />)
          }
        </div>

        {/* Mobile view all */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            to="/watches"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition"
          >
            View all watches <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}