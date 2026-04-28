// controllers/watchController.js
import mongoose from "mongoose";
import Watch from "../models/watchModel.js";
import path from "path";
import fs from "fs";

const API_BASE = "http://localhost:4000";

export async function createWatch(req, res) {
  try {
    const { name, description, price, category, brandName } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `${API_BASE}/uploads/${file.filename}`);
    }
    if (images.length === 0 && req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (!name || !description || !price || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "name, description, price and at least one image are required",
      });
    }

    const doc = new Watch({
      _id: new mongoose.Types.ObjectId(),
      name,
      description,
      price,
      category,
      brandName,
      image: images,
    });

    const saved = await doc.save();
    return res.status(201).json({ success: true, message: "Watch created", data: saved });
  } catch (err) {
    console.error("createWatch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getWatches(req, res) {
  try {
    const { category, sort = "-createdAt", page = 1, limit = 12 } = req.query;
    const filter = {};

    if (typeof category === "string") {
      const cat = category.trim().toLowerCase();
      if (cat === "men" || cat === "women") filter.category = cat;
    }

    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, parseInt(limit, 10) || 12);
    const skip = (pg - 1) * lim;

    const total = await Watch.countDocuments(filter);
    const items = await Watch.find(filter).sort(sort).skip(skip).limit(lim).lean();

    return res.json({ success: true, total, page: pg, limit: lim, items });
  } catch (err) {
    console.error("getWatches error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function deleteWatch(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const w = await Watch.findById(id);
    if (!w) return res.status(404).json({ success: false, message: "Watch not found" });

    // Delete all associated image files
    const imageArr = Array.isArray(w.image) ? w.image : w.image ? [w.image] : [];
    imageArr.forEach((imgUrl) => {
      try {
        const filename = imgUrl.split("/uploads/")[1];
        if (filename) {
          const filepath = path.join(process.cwd(), "uploads", filename);
          fs.unlink(filepath, (err) => {
            if (err) console.warn("Failed to unlink:", filepath);
          });
        }
      } catch (e) {
        console.warn("Error deleting image file:", e);
      }
    });

    await Watch.findByIdAndDelete(id);
    return res.json({ success: true, message: "Watch deleted" });
  } catch (err) {
    console.error("deleteWatch error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Matches by brandName slug — e.g. /brands/audemars-piguet
// Watch.brandName is stored as slugified lowercase (set by AddPage)
export async function getWatchesByBrand(req, res) {
  try {
    const slug = req.params.brandName?.toLowerCase().trim();
    if (!slug) return res.status(400).json({ success: false, message: "brandName is required" });

    // Try exact match first, then slug match
    let items = await Watch.find({ brandName: slug }).sort({ createdAt: -1 }).lean();

    if (items.length === 0) {
      // Fallback: match brands stored with spaces or different casing
      items = await Watch.find({
        brandName: { $regex: new RegExp(`^${slug.replace(/-/g, "[\\s-]")}$`, "i") },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    return res.json({ success: true, items });
  } catch (err) {
    console.error("getWatchesByBrand error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getWatchById(req, res) {
  try {
    const { id } = req.params;
    const watch = await Watch.findById(id);
    if (!watch) {
      return res.status(404).json({ success: false, message: "Watch not found" });
    }
    return res.json({ success: true, data: watch });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateWatch(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, category, brandName, keepImages } = req.body;

    const kept = Array.isArray(keepImages)
      ? keepImages
      : keepImages
      ? [keepImages]
      : [];

    const newImageUrls = (req.files ?? []).map(
      (f) => `${API_BASE}/uploads/${f.filename}`
    );

    const image = [...kept, ...newImageUrls];

    if (image.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required.",
      });
    }

    const updated = await Watch.findByIdAndUpdate(
      id,
      { name, description, price, category, brandName, image },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Watch not found." });
    }

    return res.json({ success: true, message: "Watch updated.", data: updated });
  } catch (err) {
    console.error("updateWatch error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
}