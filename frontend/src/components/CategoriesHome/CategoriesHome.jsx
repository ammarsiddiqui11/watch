// src/components/CategoriesHome.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { categoriesHomeStyles } from "../../assets/dummyStyles";
import { RefreshCw, ImageOff } from "lucide-react";

const API_BASE = "http://localhost:4000";

function normalizeUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

const CategoriesHome = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

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
      .catch(() => {
        // silently fail — section just won't render
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className={categoriesHomeStyles.section}>
        <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm">Loading brands…</span>
        </div>
      </section>
    );
  }

  if (!brands.length) return null;

  return (
    <section className={categoriesHomeStyles.section}>
      <div className={categoriesHomeStyles.container}>
        {/* Heading */}
        <header
          className={categoriesHomeStyles.header}
          style={categoriesHomeStyles.playfairFont}
        >
          <h1
            className={categoriesHomeStyles.h1}
            style={categoriesHomeStyles.h1FontSize}
          >
            <span className={categoriesHomeStyles.h1SpanRegular}>Premium Watch </span>
            <span className={categoriesHomeStyles.h1SpanAccent}>Brands</span>
          </h1>
          <div className={categoriesHomeStyles.underline} />
          <p className={categoriesHomeStyles.subtext}>
            Discover the world's most prestigious watchmakers — curated picks for every style.
          </p>
        </header>

        {/* Grid */}
        <div
          className={categoriesHomeStyles.grid}
          style={categoriesHomeStyles.playfairFont}
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={brand.link}
              className={categoriesHomeStyles.cardLink}
              onMouseEnter={() => setHoveredId(brand.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className={categoriesHomeStyles.cardWrapper}>
                <div className={categoriesHomeStyles.imageContainer}>
                  {brand.image ? (
                    <img
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
                      className={categoriesHomeStyles.image}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling?.style && (e.currentTarget.nextSibling.style.display = "flex");
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full items-center justify-center text-slate-300 hidden"
                    style={{ display: brand.image ? "none" : "flex" }}
                  >
                    <ImageOff size={28} />
                  </div>
                </div>

                <div className={categoriesHomeStyles.cardContent}>
                  <h3
                    className={`${categoriesHomeStyles.cardTitleBase} ${
                      hoveredId === brand.id
                        ? categoriesHomeStyles.cardTitleHover
                        : categoriesHomeStyles.cardTitleNormal
                    }`}
                  >
                    {brand.name}
                  </h3>
                </div>

                <span className={categoriesHomeStyles.focusRing} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesHome;