// src/pages/List/ListPage.jsx
import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { listPageStyles } from "../../assets/dummyStyles";

export default function ListPage() {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE = "http://localhost:4000";
  const LIST_PATH = "/api/watches";

  // Normalize image URLs so deployed admin doesn't try to reach localhost
  const normalizeImageUrl = (raw) => {
    if (!raw) return "";
    if (typeof raw !== "string") return "";

    // Relative path -> prefix with API_BASE
    if (raw.startsWith("/")) {
      return `${API_BASE}${raw}`;
    }

    // Replace any localhost or 127.0.0.1 origin with your production API base
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw)) {
      return raw.replace(
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
        API_BASE
      );
    }

    // Avoid mixed-content: if admin is https and image is http, try upgrading to https
    if (raw.startsWith("http://") && window?.location?.protocol === "https:") {
      try {
        const u = new URL(raw);
        u.protocol = "https:";
        return u.toString();
      } catch (e) {
        // fall back to raw
      }
    }

    return raw;
  };

  const mapServerToUI = (item) => {
    let img = item.image ?? item.img ?? "";
    img = normalizeImageUrl(img);

    return {
      id: item._id,
      name: item.name,
      desc: item.description ?? "",
      price: item.price,
      category: item.category ?? "Brand",
      brand: item.brandName ?? "",
      img,
    };
  };

  useEffect(() => {
    let mounted = true;
    const fetchWatches = async () => {
      setLoading(true);
      try {
        // Short, intentional change: request a very large limit so backend returns all records.
        const resp = await axios.get(`${API_BASE}${LIST_PATH}?limit=10000`);
        const data = resp.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.watches)
          ? data.watches
          : Array.isArray(data?.results)
          ? data.results
          : [];

        if (mounted) {
          setWatches(items.map(mapServerToUI));
        }
      } catch (err) {
        console.error("Failed to fetch watches:", err);
        if (mounted) {
          setWatches([]);
          toast.error("Could not fetch watches from server.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWatches();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleDelete(id) {
    const prev = watches.slice();
    setWatches((list) => list.filter((w) => w.id !== id));
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE}${LIST_PATH}/${id}`);
      toast.success("Watch deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete item. Restoring list.");
      setWatches(prev);
    } finally {
      setDeletingId(null);
    }
  }

  const getCategoryLabel = (watch) => {
    const cat = String(watch.category ?? "").toLowerCase();
    if (cat === "men") return "Men";
    if (cat === "women") return "Women";
    if (cat === "brand" || watch.brand) return watch.brand || "Brand";
    return watch.category || "";
  };

  return (
    <div className={listPageStyles.root}>
      <ToastContainer />
      <div className={listPageStyles.container}>
        <header className={listPageStyles.header}>
          <h1 className={listPageStyles.title}>Watch Collection</h1>
        </header>

        <section className={listPageStyles.grid}>
          {watches.map((watch) => (
            <article key={watch.id} className={listPageStyles.article}>
              <div className={listPageStyles.imageContainer}>
                {watch.img ? (
                  <img
                    src={watch.img}
                    alt={watch.name}
                    className={listPageStyles.image}
                    onError={(e) => {
                      e.currentTarget.style.objectFit = "contain";
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='16'%3EImage not available%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className={listPageStyles.fallbackImageContainer}>
                    No image
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <h3 className={listPageStyles.name}>{watch.name}</h3>
                <p className={listPageStyles.description}>{watch.desc}</p>

                <div className="flex items-center gap-2 text-sm mt-2">
                  <span className={listPageStyles.categoryTag}>
                    {getCategoryLabel(watch)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className={listPageStyles.price}>₹{watch.price}</div>
                  <button
                    onClick={() => handleDelete(watch.id)}
                    className={listPageStyles.deleteButton}
                    disabled={deletingId === watch.id}
                    aria-disabled={deletingId === watch.id}
                  >
                    <Trash2 size={16} />
                    {deletingId === watch.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {!loading && (!watches || watches.length === 0) && (
          <p className={listPageStyles.noItems}>No items found.</p>
        )}
      </div>
    </div>
  );
}
