import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { comingSoonStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000";

// --- helper: same normalization logic from WatchPage ---
function normalizeImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;
  if (raw.startsWith("/")) return `${baseHost}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  }
  return raw;
}

export default function ComingSoonWatchesPage() {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use the format function from styles
  const formatINR = comingSoonStyles.formatINR;

  useEffect(() => {
    let mounted = true;
    const fetchRecentWatches = async () => {
      setLoading(true);
      try {
        // Fetching with a limit of 5 to show the most recent arrivals
        // If your backend supports sorting, you could add: ?sort=-createdAt
        const resp = await axios.get(`${API_BASE}/api/watches?limit=5`);
        const data = resp.data;
        
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.watches)
          ? data.watches
          : [];

        if (mounted) {
          const mapped = items.map((item) => ({
            id: item._id ?? item.id,
            name: item.name ?? "",
            price: item.price ?? 0,
            // Map image/img and normalize the URL
            imgUrl: normalizeImageUrl((Array.isArray(item.image) ? item.image[0] : item.image) ?? item.img ?? ""),
          }));
          setWatches(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch recent watches:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecentWatches();
    return () => { mounted = false; };
  }, []);

  return (
    <section className={comingSoonStyles.section}>
      <div className={comingSoonStyles.container}>
        <div className={comingSoonStyles.headerContainer}>
          <div className={comingSoonStyles.titleContainer}>
            <h2
              className={comingSoonStyles.title}
              style={comingSoonStyles.titleStyle}
            >
              New Arrivals
            </h2>
            <p className={comingSoonStyles.subtitle}>
              Recently Added
            </p>
          </div>
          <Link className={comingSoonStyles.viewAllLink} to="/watches">
            View All ›
          </Link>
        </div>

        <div className={comingSoonStyles.watchesContainer}>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading arrivals...</div>
          ) : (
            <div className={comingSoonStyles.watchesRow}>
              {watches.map((w) => (
                <figure key={w.id} className={comingSoonStyles.watchItem}>
                  <Link to={`/watches/${w.id}`}>
                    <div className={comingSoonStyles.imageContainer}>
                      <img
                        src={w.imgUrl}
                        alt={w.name}
                        className={comingSoonStyles.image}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22240%22><rect width='100%25' height='100%25' fill='%23f3f4f6'/></svg>";
                        }}
                      />
                    </div>
                  </Link>

                  <figcaption className={comingSoonStyles.figcaption}>
                    <Link to={`/watches/${w.id}`}>
                      <div className={comingSoonStyles.watchName}>{w.name}</div>
                    </Link>
                    <div className={comingSoonStyles.price}>
                      {formatINR(w.price)}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}