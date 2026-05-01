// src/components/CategoriesHome/CategoriesHome.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { RefreshCw, ImageOff, ArrowRight } from "lucide-react";

const API_BASE = "http://localhost:4000";

function normalizeUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

function BrandCard({ brand }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <Link
      to={brand.link}
      className="group flex flex-col items-center gap-3 focus:outline-none"
    >
      {/* Circle image container */}
      <div className="w-full aspect-square rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center group-hover:shadow-lg group-hover:border-slate-200 transition-all duration-300">
        {!imgErr && brand.image ? (
          <img
            src={brand.image}
            alt={brand.name}
            loading="lazy"
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300">
            <ImageOff size={24} />
            <span className="text-[10px]">No image</span>
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-slate-700 text-center group-hover:text-slate-900 transition-colors leading-tight">
        {brand.name}
      </span>
    </Link>
  );
}

// Skeleton for loading state
function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-3 animate-pulse">
      <div className="w-full aspect-square rounded-2xl bg-slate-100" />
      <div className="h-3 bg-slate-100 rounded w-3/4" />
    </div>
  );
}

const CategoriesHome = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${API_BASE}/api/brands`)
      .then((resp) => {
        if (!mounted) return;
        const raw = resp.data?.brands ?? [];
        setBrands(
          raw.map((b) => ({
            id: b._id,
            name: b.name,
            slug: b.slug,
            image: normalizeUrl(b.image),
            link: `/brands/${b.slug}`,
          }))
        );
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  // Don't render the section at all if empty (removes weird spacing)
  if (!loading && !brands.length) return null;

  return (
    <section className="bg-slate-50 py-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shop by Brand</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Premium Watch{" "}
              <span className="text-amber-500">Brands</span>
            </h2>
            <p className="mt-2 text-slate-500 text-sm max-w-md">
              Discover the world's most prestigious watchmakers — curated for every style.
            </p>
          </div>
          <Link
            to="/watches"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-6">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
            : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)
          }
        </div>

        {/* Mobile view all */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            to="/watches"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 border border-slate-200 bg-white px-5 py-2.5 rounded-xl hover:bg-slate-50 transition"
          >
            View all watches <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesHome;