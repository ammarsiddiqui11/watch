// routes/brandRoute.js
import express from "express";
import multer from "multer";
import path from "path";
import { getBrands, createBrand, updateBrand, deleteBrand } from "../controllers/brandController.js";

const brandRouter = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `brand-${unique}${ext}`);
  },
});
const upload = multer({ storage });

brandRouter.get("/", getBrands);
brandRouter.post("/", upload.single("image"), createBrand);
brandRouter.put("/:id", upload.single("image"), updateBrand);
brandRouter.delete("/:id", deleteBrand);

export default brandRouter;