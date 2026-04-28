// controllers/brandController.js
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import Brand from "../models/brandModel.js";

const API_BASE = "http://localhost:4000";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function deleteFile(url) {
  if (!url) return;
  try {
    const filename = url.split("/uploads/")[1];
    if (!filename) return;
    const filepath = path.join(process.cwd(), "uploads", filename);
    fs.unlink(filepath, (err) => {
      if (err) console.warn("Could not delete file:", filepath);
    });
  } catch (e) {
    console.warn("deleteFile error:", e);
  }
}

// GET /api/brands
export async function getBrands(req, res) {
  try {
    const brands = await Brand.find().sort({ name: 1 }).lean();
    return res.json({ success: true, brands });
  } catch (err) {
    console.error("getBrands error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// POST /api/brands
export async function createBrand(req, res) {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Brand name is required" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Brand image is required" });
    }

    const slug = slugify(name);
    const existing = await Brand.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: `Brand "${name}" already exists` });
    }

    const image = `${API_BASE}/uploads/${req.file.filename}`;
    const brand = new Brand({ _id: new mongoose.Types.ObjectId(), name: name.trim(), slug, image });
    const saved = await brand.save();
    return res.status(201).json({ success: true, message: "Brand created", brand: saved });
  } catch (err) {
    console.error("createBrand error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// PUT /api/brands/:id
export async function updateBrand(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    if (name?.trim()) {
      brand.name = name.trim();
      brand.slug = slugify(name.trim());
    }

    if (req.file) {
      // Delete old image from disk
      deleteFile(brand.image);
      brand.image = `${API_BASE}/uploads/${req.file.filename}`;
    }

    const updated = await brand.save();
    return res.json({ success: true, message: "Brand updated", brand: updated });
  } catch (err) {
    console.error("updateBrand error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// DELETE /api/brands/:id
export async function deleteBrand(req, res) {
  try {
    const { id } = req.params;
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }
    deleteFile(brand.image);
    await Brand.findByIdAndDelete(id);
    return res.json({ success: true, message: "Brand deleted" });
  } catch (err) {
    console.error("deleteBrand error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}