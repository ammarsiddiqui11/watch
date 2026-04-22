// src/pages/Brand/BrandPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import axios from "axios";
import { useCart } from "../../CartContext";
import { brandPageStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000";

// --- helper: normalize image URLs so deployed admin doesn't try to reach localhost ---
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
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }

  // If admin is served over https and raw is http, try upgrading to https (avoid mixed content)
  if (raw.startsWith("http://") && typeof window !== "undefined" && window.location.protocol === "https:") {
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

export default function BrandPage() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const { addItem, cart, increment, decrement } = useCart();

  const [brandWatches, setBrandWatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      try {
        document.documentElement && (document.documentElement.scrollTop = 0);
        document.body && (document.body.scrollTop = 0);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!brandName) return setBrandWatches([]);

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/api/watches/brands/${encodeURIComponent(
          brandName
        )}`;
        const resp = await axios.get(url);
        const items = resp?.data?.items ?? resp?.data ?? [];
        const mapped = (items || []).map((it) => {
          const id = it._id ?? it.id;
          const rawPrice =
            typeof it.price === "number"
              ? it.price
              : Number(String(it.price ?? "").replace(/[^0-9.-]+/g, "")) || 0;
          // --- use normalizer here ---
          const rawImg = it.image ?? it.img ?? "";
          const img = normalizeImageUrl(rawImg);

          return {
            id: String(id),
            image: img || null,
            name: it.name ?? "",
            desc: it.description ?? "",
            priceDisplay: `₹${Number(rawPrice).toFixed(2)}`,
            price: rawPrice,
          };
        });
        if (!cancelled) setBrandWatches(mapped);
      } catch (err) {
        console.error("Failed to fetch brand watches:", err);
        if (!cancelled) setError("Failed to load watches. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandName]);

  const findInCart = (id) =>
    cart.find(
      (p) => String(p.id) === String(id) || String(p.productId) === String(id)
    );

  if (loading) {
    return (
      <div className={brandPageStyles.loadingContainer}>
        <div className="text-center">
          <div className={brandPageStyles.loadingText}>
            Loading watches...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={brandPageStyles.notFoundContainer}>
        <div className={brandPageStyles.notFoundCard}>
          <h2 className={brandPageStyles.notFoundTitle}>Error</h2>
          <p className={brandPageStyles.notFoundText}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className={brandPageStyles.goBackButton}
          >
            <ArrowLeft className={brandPageStyles.goBackIcon} /> Go back
          </button>
        </div>
      </div>
    );
  }

  if (!brandWatches.length) {
    return (
      <div className={brandPageStyles.notFoundContainer}>
        <div className={brandPageStyles.notFoundCard}>
          <h2 className={brandPageStyles.notFoundTitle}>
            No watches found
          </h2>
          <p className={brandPageStyles.notFoundText}>
            This brand has no watches listed in our collection yet.
          </p>
          <button
            onClick={() => navigate(-1)}
            className={brandPageStyles.goBackButton}
          >
            <ArrowLeft className={brandPageStyles.goBackIcon} /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={brandPageStyles.mainContainer}>
      <div className={brandPageStyles.innerContainer}>
        <div className={brandPageStyles.headerContainer}>
          <div className={brandPageStyles.backButtonContainer}>
            <button
              onClick={() => navigate(-1)}
              className={brandPageStyles.backButton}
              aria-label="Go back"
            >
              <div className={brandPageStyles.backIconContainer}>
                <ArrowLeft className={brandPageStyles.backIcon} />
              </div>
              <span className={brandPageStyles.backText}>Back</span>
            </button>
          </div>

          <div className={brandPageStyles.titleContainer}>
            <h1 className={brandPageStyles.title}>
              {brandName} Collections
            </h1>
          </div>
        </div>

        <div className={brandPageStyles.grid}>
          {brandWatches.map((watch) => {
            const inCart = findInCart(watch.id);
            const displayedQty =
              inCart?.qty ?? inCart?.quantity ?? inCart?.count ?? 0;
            const targetId = inCart?.id ?? inCart?.productId ?? watch.id;

            return (
              <div
                key={watch.id}
                className={brandPageStyles.card}
              >
                <div className={brandPageStyles.imageContainer}>
                  {watch.image ? (
                    <img
                      src={watch.image}
                      alt={watch.name}
                      className={brandPageStyles.image}
                      onError={(e) => {
                        e.currentTarget.style.objectFit = "contain";
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className={brandPageStyles.noImagePlaceholder}>
                      No image
                    </div>
                  )}
                </div>

                <div className={brandPageStyles.detailsContainer}>
                  <h2 className={brandPageStyles.watchName}>
                    {watch.name}
                  </h2>
                  <p className={brandPageStyles.watchDesc}>
                    {watch.desc}
                  </p>

                  <div className={brandPageStyles.priceAndControls}>
                    <p className={brandPageStyles.price}>
                      {watch.priceDisplay ?? `₹${watch.price.toFixed(2)}`}
                    </p>

                    {displayedQty > 0 ? (
                      <div className={brandPageStyles.quantityContainer}>
                        <button
                          onClick={() => decrement(targetId)}
                          aria-label={`Decrease ${watch.name} quantity`}
                          className={brandPageStyles.quantityButton}
                        >
                          <Minus className={brandPageStyles.quantityIcon} />
                        </button>

                        <div className={brandPageStyles.quantityCount}>
                          {displayedQty}
                        </div>

                        <button
                          onClick={() => increment(targetId)}
                          aria-label={`Increase ${watch.name} quantity`}
                          className={brandPageStyles.quantityButton}
                        >
                          <Plus className={brandPageStyles.quantityIcon} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          addItem({
                            id: watch.id,
                            productId: watch.id,
                            name: watch.name,
                            price: watch.price,
                            img: watch.image,
                            qty: 1,
                          })
                        }
                        className={brandPageStyles.addButton}
                      >
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
