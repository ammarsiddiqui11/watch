// src/pages/List/ListPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Trash2, Edit, X, Upload, PlusCircle, Sparkles,
  Search, SlidersHorizontal, ImageOff, CheckCircle2,
  AlertTriangle, RefreshCw, Package
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { listPageStyles } from "../../assets/dummyStyles";

const API_BASE = "http://localhost:4000";
const LIST_PATH = "/api/watches";

function normalizeImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const baseHost = API_BASE.replace(/\/api\/?$/i, "") || API_BASE;
  if (raw.startsWith("/")) return `${baseHost}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, baseHost);
  return raw;
}

// Returns the first usable image URL from a server item
function getFirstImage(item) {
  const arr = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
  return normalizeImageUrl(arr[0] ?? item.img ?? "");
}

// Returns ALL image URLs from a server item (for modal)
function getAllImages(item) {
  const raw = item.raw ?? item; // support both mapped and raw items
  const arr = Array.isArray(raw.image) ? raw.image : raw.image ? [raw.image] : [];
  return arr.map(normalizeImageUrl).filter(Boolean);
}

function mapServerToUI(item) {
  return {
    id: item._id ?? item.id,
    name: item.name ?? "",
    desc: item.description ?? item.desc ?? "",
    price: item.price ?? 0,
    category: item.category ?? "men",
    brand: item.brandName ?? "",
    img: getFirstImage(item),
    allImages: getAllImages({ raw: item }),
    raw: item, // keep raw for edits
  };
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle size={22} />
          <h3 className="font-bold text-slate-800 text-lg">Are you sure?</h3>
        </div>
        <p className="text-slate-500 text-sm">{message}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow-lg shadow-red-100">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Watch Card ────────────────────────────────────────────────────────────────
function WatchCard({ watch, onEdit, onDelete, isDeleting }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className={listPageStyles.article}>
      <div className={listPageStyles.imageContainer + " relative"}>
        {!imgError && watch.img ? (
          <img
            src={watch.img}
            alt={watch.name}
            className={listPageStyles.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
            <ImageOff size={28} />
            <span className="text-xs font-medium">No image</span>
          </div>
        )}

        {/* Image count badge */}
        {watch.allImages.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {watch.allImages.length} photos
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 right-2 bg-white/90 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
          {watch.category}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 p-3">
        <h3 className={listPageStyles.name + " truncate"} title={watch.name}>
          {watch.name}
        </h3>
        {watch.brand && (
          <p className="text-xs text-slate-400 truncate">by {watch.brand}</p>
        )}
        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{watch.desc}</p>

        <div className="flex items-center justify-between mt-3">
          <div className={listPageStyles.price}>₹{Number(watch.price).toLocaleString("en-IN")}</div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit(watch)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(watch.id)}
              disabled={isDeleting}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-40"
              aria-label="Delete"
            >
              {isDeleting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Update Modal ──────────────────────────────────────────────────────────────
function UpdateModal({ watch, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: watch.name,
    desc: watch.desc,
    price: watch.price,
    category: watch.category,
    brand: watch.brand,
  });

  // existingImages: URLs already saved in DB (shown greyed out, can be removed)
  const [existingImages, setExistingImages] = useState(watch.allImages);
  // removedImages: track which existing URLs user wants to drop
  const [removedImages, setRemovedImages] = useState([]);
  // newImageFiles: fresh files to upload
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => newPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [newPreviewUrls]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files ?? []);
    const valid = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) { toast.warn(`"${f.name}" skipped — not an image.`); continue; }
      if (f.size > 5 * 1024 * 1024) { toast.warn(`"${f.name}" skipped — over 5 MB.`); continue; }
      valid.push(f);
    }
    if (!valid.length) return;
    setNewImageFiles((p) => [...p, ...valid]);
    setNewPreviewUrls((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (idx) => {
    URL.revokeObjectURL(newPreviewUrls[idx]);
    setNewImageFiles((p) => p.filter((_, i) => i !== idx));
    setNewPreviewUrls((p) => p.filter((_, i) => i !== idx));
  };

  const toggleRemoveExisting = (url) => {
    setRemovedImages((p) =>
      p.includes(url) ? p.filter((u) => u !== url) : [...p, url]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const keptImages = existingImages.filter((u) => !removedImages.includes(u));
    const totalImages = keptImages.length + newImageFiles.length;

    if (totalImages === 0) {
      toast.error("At least one image is required.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("description", form.desc.trim());
      fd.append("price", String(Number(form.price)));
      fd.append("category", form.category);
      fd.append("brandName", form.brand.trim());

      // Tell the backend which existing image URLs to keep
      keptImages.forEach((url) => fd.append("keepImages", url));

      // Append new files
      newImageFiles.forEach((f) => fd.append("images", f));

      await axios.put(`${API_BASE}${LIST_PATH}/${watch.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Watch updated successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Update failed.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text", extra = {}) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        {...extra}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-slate-800">Edit Product</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── Image Section ── */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Upload size={14} /> Images
            </label>

            <div className="flex flex-wrap gap-3">
              {/* Existing images */}
              {existingImages.map((url, idx) => {
                const removed = removedImages.includes(url);
                return (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-sm border border-slate-100">
                    <img
                      src={url}
                      className={`w-full h-full object-cover transition-all duration-200 ${removed ? "opacity-30 grayscale" : ""}`}
                      alt={`existing-${idx}`}
                      onError={(e) => { e.currentTarget.src = ""; }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleRemoveExisting(url)}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        removed
                          ? "opacity-100 bg-red-50/60"
                          : "opacity-0 group-hover:opacity-100 bg-black/30"
                      }`}
                    >
                      {removed ? (
                        <CheckCircle2 size={20} className="text-green-500" title="Click to restore" />
                      ) : (
                        <X size={20} className="text-white" title="Remove" />
                      )}
                    </button>
                    {!removed && (
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        SAVED
                      </div>
                    )}
                    {removed && (
                      <div className="absolute bottom-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        REMOVE
                      </div>
                    )}
                  </div>
                );
              })}

              {/* New image previews */}
              {newPreviewUrls.map((url, idx) => (
                <div key={`new-${idx}`} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-md border-2 border-blue-200">
                  <img src={url} className="w-full h-full object-cover" alt={`new-${idx}`} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity"
                  >
                    <X size={20} className="text-white" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    NEW
                  </div>
                </div>
              ))}

              {/* Add image button */}
              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors text-blue-500">
                <PlusCircle size={22} />
                <span className="text-[10px] font-bold mt-1">ADD</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </label>
            </div>

            {/* Summary */}
            <p className="text-xs text-slate-400">
              {existingImages.length - removedImages.length} saved · {newImageFiles.length} new · {removedImages.length} to remove
            </p>
          </div>

          {/* ── Form Fields ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Product Name", "name", "text", { required: true })}
            {field("Price (INR)", "price", "number", { required: true, min: 1 })}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
              <select
                className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="brand">Brand</option>
              </select>
            </div>
            {field("Brand", "brand")}
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
              <textarea
                rows={3}
                className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                value={form.desc}
                onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ListPage() {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [editWatch, setEditWatch] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchWatches = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}${LIST_PATH}?limit=10000`);
      const raw = resp.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items) ? raw.items
        : Array.isArray(raw?.watches) ? raw.watches
        : Array.isArray(raw?.data) ? raw.data
        : [];
      setWatches(items.map(mapServerToUI));
    } catch {
      toast.error("Could not fetch watches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWatches(); }, [fetchWatches]);

  const handleDeleteConfirmed = async () => {
    const id = confirmId;
    setConfirmId(null);
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE}${LIST_PATH}/${id}`);
      setWatches((list) => list.filter((w) => w.id !== id));
      toast.success("Watch deleted.");
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side search + filter
  const filtered = watches.filter((w) => {
    const matchCat = categoryFilter === "all" || w.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || w.name.toLowerCase().includes(q) || w.brand.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className={listPageStyles.root}>
      <ToastContainer position="top-right" autoClose={2500} />

      <div className={listPageStyles.container}>
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={listPageStyles.title}>Watch Collection</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {watches.length} product{watches.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={fetchWatches}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors self-start sm:self-auto"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or brand…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
            {["all", "men", "women", "brand"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 text-xs font-bold rounded-lg capitalize transition-colors ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading collection…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Package size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">
              {watches.length === 0 ? "No watches added yet." : "No results for your search."}
            </p>
          </div>
        ) : (
          <section className={listPageStyles.grid}>
            {filtered.map((watch) => (
              <WatchCard
                key={watch.id}
                watch={watch}
                onEdit={setEditWatch}
                onDelete={setConfirmId}
                isDeleting={deletingId === watch.id}
              />
            ))}
          </section>
        )}
      </div>

      {/* ── Update Modal ── */}
      {editWatch && (
        <UpdateModal
          watch={editWatch}
          onClose={() => setEditWatch(null)}
          onSuccess={fetchWatches}
        />
      )}

      {/* ── Delete Confirm ── */}
      {confirmId && (
        <ConfirmDialog
          message="This will permanently delete the watch and cannot be undone."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}