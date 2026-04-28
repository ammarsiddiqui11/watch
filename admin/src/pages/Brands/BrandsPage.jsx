// src/pages/Brands/BrandsPage.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  PlusCircle, Trash2, Edit, X, Upload, RefreshCw,
  ImageOff, CheckCircle2, AlertTriangle, Package, Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000";

function normalizeUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  const base = API_BASE.replace(/\/api\/?$/i, "");
  if (raw.startsWith("/")) return `${base}${raw}`;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(raw))
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, base);
  return raw;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <AlertTriangle size={22} />
          <h3 className="font-bold text-slate-800 text-lg">Are you sure?</h3>
        </div>
        <p className="text-slate-500 text-sm">{message}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition shadow-lg shadow-red-100 text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Brand Form Modal (used for both Add and Edit) ──────────────────────────
function BrandModal({ brand, onClose, onSuccess }) {
  const isEdit = !!brand;
  const [name, setName] = useState(brand?.name ?? "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(brand ? normalizeUrl(brand.image) : "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.warn("Please select an image file.");
    if (f.size > 5 * 1024 * 1024) return toast.warn("Image must be under 5 MB.");
    setImageFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Brand name is required.");
    if (!isEdit && !imageFile) return toast.error("Please select an image.");

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (imageFile) fd.append("image", imageFile);

      if (isEdit) {
        await axios.put(`${API_BASE}/api/brands/${brand.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Brand updated!");
      } else {
        await axios.post(`${API_BASE}/api/brands`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Brand added!");
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? "Edit Brand" : "Add New Brand"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Upload size={13} /> Brand Logo / Image
            </label>

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <ImageOff size={24} className="text-slate-300" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-sm font-medium text-slate-700">
                  <PlusCircle size={15} />
                  {previewUrl ? "Change Image" : "Choose Image"}
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setPreviewUrl(brand ? normalizeUrl(brand.image) : ""); }}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition px-1"
                  >
                    <X size={12} /> Remove new image
                  </button>
                )}
                <p className="text-[11px] text-slate-400">JPG / PNG / WebP · max 5 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Brand Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rolex"
              required
              className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Brand Card ─────────────────────────────────────────────────────────────
function BrandCard({ brand, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        {!imgError && brand.image ? (
          <img
            src={brand.image}
            alt={brand.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <ImageOff size={32} />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm truncate">{brand.name}</h3>
          <p className="text-[11px] text-slate-400 truncate">/brands/{brand.slug}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(brand)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Edit"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => onDelete(brand.id)}
            className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate()

  const handleClick = () => {
    // "/" represents your base URL (root)
    navigate('/'); 
  };

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API_BASE}/api/brands`);
      const raw = resp.data?.brands ?? [];
      setBrands(
        raw.map((b) => ({
          id: b._id,
          name: b.name,
          slug: b.slug,
          image: normalizeUrl(b.image),
        }))
      );
    } catch {
      toast.error("Could not load brands.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleDeleteConfirmed = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      await axios.delete(`${API_BASE}/api/brands/${id}`);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast.success("Brand deleted.");
    } catch {
      toast.error("Failed to delete brand.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="max-w-5xl mx-auto">
        {/* Navigation / Close Button Row */}
        <div className="flex justify-start mb-6">
          <button 
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            {/* Adding an arrow icon makes the "close/back" intent clearer */}
            <span className="text-lg">←</span> Close to Home
          </button>
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Brands</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {brands.length} brand{brands.length !== 1 ? "s" : ""} · shown on the homepage
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchBrands}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition bg-white shadow-sm"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => { setEditBrand(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-200"
            >
              <PlusCircle size={15} /> Add Brand
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <RefreshCw size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading brands…</span>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Package size={40} strokeWidth={1.5} />
            <p className="text-sm font-medium">No brands yet — add your first one.</p>
            <button
              onClick={() => { setEditBrand(null); setShowModal(true); }}
              className="mt-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
            >
              Add Brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brands.map((brand) => (
              <BrandCard
                key={brand.id}
                brand={brand}
                onEdit={(b) => { setEditBrand(b); setShowModal(true); }}
                onDelete={setConfirmId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <BrandModal
          brand={editBrand}
          onClose={() => { setShowModal(false); setEditBrand(null); }}
          onSuccess={fetchBrands}
        />
      )}
      {confirmId && (
        <ConfirmDialog
          message="This will permanently delete the brand. Watches linked to it won't be affected."
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}