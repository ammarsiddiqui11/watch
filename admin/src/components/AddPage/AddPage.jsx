// src/pages/Add/AddPage.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  PlusCircle,
  IndianRupee,
  Trash2,
  Upload,
  Sparkles,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { themes, themeButtonColors, classes, getInputClass } from "../../assets/dummyStyles";

export default function AddPage() {
  // FIX: imageFiles is now an array; imagePreviewUrls is an array of object-URLs
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeColor, setActiveColor] = useState("grey");
  const [category, setCategory] = useState("men");
  const [brandName, setBrandName] = useState("");

  const inputRef = useRef(null);
  const API_BASE = "http://localhost:4000";
  const BRANDS = [
    "Rolex",
    "Omega",
    "Audemars Piguet",
    "Cartier",
    "Breitling",
    "IWC",
    "Hublot",
    "Jaeger LeCoultre",
    "Tag Heuer",
    "Patek Philippe",
  ];

  const theme = themes[activeColor];
  const inputClass = getInputClass(theme);

  // FIX: Revoke all object-URLs when imageFiles changes to avoid memory leaks
  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviewUrls([]);
      return;
    }
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  useEffect(() => {
    if (category !== "brand") setBrandName("");
  }, [category]);

  const clearFileInput = () => {
    if (inputRef.current) inputRef.current.value = "";
    setImageFiles([]);
    setImagePreviewUrls([]);
  };

  // FIX: Remove a single image by index, keep the rest
  const removeImageAt = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    // If the native input still holds a reference, reset it so the user can
    // re-select the same file if needed.
    if (inputRef.current) inputRef.current.value = "";
  };

  // FIX: Accept ALL selected files, validate each, and append to existing list
  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;

    const maxMB = 5;
    const valid = [];
    for (const f of newFiles) {
      if (!f.type.startsWith("image/")) {
        toast.error(`"${f.name}" is not an image — skipped.`);
        continue;
      }
      if (f.size > maxMB * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds ${maxMB} MB — skipped.`);
        continue;
      }
      valid.push(f);
    }

    if (valid.length) {
      setImageFiles((prev) => [...prev, ...valid]);
    }

    // Reset native input so the same file can be picked again later
    if (inputRef.current) inputRef.current.value = "";
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCategory("men");
    setBrandName("");
    clearFileInput();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFiles.length || !name.trim() || !description.trim() || !price.trim())
      return toast.error("Please fill all fields and select at least one image.");
    if (isNaN(Number(price)) || Number(price) <= 0)
      return toast.error("Enter a valid price greater than 0.");
    if (category === "brand" && !brandName.trim())
      return toast.error("Please select the brand.");

    setLoading(true);
    try {
      const formData = new FormData();

      // FIX: Append every file under the field name "images" (matches multer's
      // array("images") on the backend / req.files in the controller)
      imageFiles.forEach((f) => formData.append("images", f));

      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("price", String(Number(price)));
      formData.append("category", category);
      if (category === "brand") {
        formData.append(
          "brandName",
          brandName.trim().toLowerCase().replace(/\s+/g, "-")
        );
      }

      const resp = await axios.post(`${API_BASE}/api/watches`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Saved:", resp?.data);
      toast.success("Watch added successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data || null;
      toast.error(String(serverMsg || "Failed to add watch. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const prettyCategory = (c) =>
    c === "men" ? "Men" : c === "women" ? "Women" : c === "brand" ? "Brand" : c;

  return (
    <div className={`${classes.pageContainer} ${theme.bg}`}>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className={classes.maxWidthContainer}>
        <div className={classes.headerContainer}>
          <h1 className={classes.headerTitle}>
            Add New Watch
          </h1>
          <div className={classes.themeButtonsContainer}>
            {["grey", "blue", "purple"].map((c) => (
              <button
                key={c}
                onClick={() => setActiveColor(c)}
                aria-label={`${c} theme`}
                className={`${classes.themeButton(activeColor === c)} ${themeButtonColors[c]}`}
              />
            ))}
          </div>
        </div>

        <div className={classes.gridContainer}>
          <form
            onSubmit={handleSubmit}
            className={classes.formContainer(theme)}
          >
            <div>
              <div className={classes.formLabel}>
                <Upload className="w-4 h-4" /> Watch Images{" "}
                <span className={classes.requiredStar}>*</span>
              </div>

              {/* FIX: Render a thumbnail strip for every selected image */}
              {imagePreviewUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {imagePreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={url}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="absolute top-0.5 right-0.5 bg-white/90 hover:bg-white rounded-full p-0.5 shadow transition"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        <X className="w-3 h-3 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                {/* Placeholder shown only when no images selected */}
                {imagePreviewUrls.length === 0 && (
                  <div className={`${classes.imagePreviewContainer(theme)} ${classes.imagePreviewEmpty}`}>
                    <div className={classes.imagePlaceholder}>
                      <Image className="w-8 h-8" />
                      <div className="text-xs">No images</div>
                    </div>
                  </div>
                )}

                <div className="flex-1">
                  <label
                    htmlFor="watch-image"
                    className={classes.uploadButton}
                  >
                    <PlusCircle className="w-4 h-4 text-slate-700" />
                    <span className="text-slate-700 text-sm">
                      {imageFiles.length > 0 ? "Add More Images" : "Choose Images"}
                    </span>
                    {/* FIX: multiple attribute kept; onChange now handles all files */}
                    <input
                      id="watch-image"
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      multiple
                    />
                  </label>

                  {imageFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFileInput}
                      className={classes.removeButton}
                    >
                      <Trash2 className="w-4 h-4 text-slate-600" /> Remove All
                    </button>
                  )}
                  <p className={classes.helperText}>
                    Recommended: JPG/PNG. Max size: 5 MB per image.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className={classes.formLabelSimple}>
                Watch Name <span className={classes.requiredStar}>*</span>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Classic Silver Chrono"
                className={inputClass}
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className={classes.formLabelSimple}>
                Category <span className={classes.requiredStar}>*</span>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
                aria-label="Select category"
                disabled={loading}
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="brand">Brand</option>
              </select>
            </div>

            {category === "brand" && (
              <div>
                <div className={classes.formLabelSimple}>
                  Brand <span className={classes.requiredStar}>*</span>
                </div>
                <select
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className={inputClass}
                  required
                  disabled={loading}
                >
                  <option value="">Select brand</option>
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className={classes.formLabelSimple}>
                Description <span className={classes.requiredStar}>*</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Short description about the watch"
                className={`${inputClass} resize-none`}
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className={classes.formLabelSimple}>
                Price (INR) <span className={classes.requiredStar}>*</span>
              </div>
              <div className={classes.priceInputContainer}>
                <IndianRupee className={classes.priceIcon} />
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="199.99"
                  inputMode="decimal"
                  className={classes.priceInput(theme)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mt-3">
              <button
                type="submit"
                disabled={loading}
                className={classes.submitButton(theme, loading)}
              >
                <PlusCircle className="w-5 h-5" />
                <span className="text-sm">
                  {loading ? "Adding..." : "Add Watch"}
                </span>
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-4">
            <div
              className={classes.previewContainer(theme)}
            >
              <div className={classes.previewHeader}>
                <div className={classes.previewTitle}>
                  <Sparkles className="w-4 h-4" /> Preview
                </div>
              </div>

              <div
                className={classes.previewCard(theme)}
              >
                {imagePreviewUrls.length > 0 ? (
                  <div className={classes.previewImageContainer}>
                    {/* Preview shows the first selected image */}
                    <img
                      src={imagePreviewUrls[0]}
                      alt="watch"
                      className="w-full h-full object-cover"
                    />
                    {imagePreviewUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                        +{imagePreviewUrls.length - 1} more
                      </div>
                    )}
                    <div className={classes.previewNewBadge}>
                      New
                    </div>
                  </div>
                ) : (
                  <div className={classes.previewPlaceholder}>
                    <Image className="w-12 h-12" />
                  </div>
                )}

                <div className={classes.previewContent}>
                  <h3 className={classes.previewName}>
                    {name || "Watch name"}
                  </h3>
                  <div className={classes.previewCategory}>
                    <strong>Category:</strong> {prettyCategory(category)}
                    {category === "brand" && brandName && (
                      <span className="ml-2 text-slate-500">({brandName})</span>
                    )}
                  </div>
                  <p className={classes.previewDescription}>
                    {description || "Watch description will appear here."}
                  </p>
                  <div className={classes.previewPriceContainer}>
                    <div className={classes.previewPriceLabel}>Price</div>
                    <div className={classes.previewPriceValue}>
                      {price ? `₹${Number(price).toFixed(2)}` : "₹0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}