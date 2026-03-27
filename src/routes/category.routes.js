import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  uploadCategoryImage,
  removeCategoryImage,
} from "../controllers/category.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { allowedTo } from "../middlewares/allowedTo.middleware.js";
import { uploadSingleImage } from "../middlewares/upload.middleware.js";

const router = Router();

// PUBLIC
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// ADMIN ONLY
router.post("/", protect, allowedTo("admin"), createCategory);
router.patch("/:id", protect, allowedTo("admin"), updateCategory);
router.delete("/:id", protect, allowedTo("admin"), deleteCategory);
router.patch("/:id/toggle-active", protect, allowedTo("admin"), toggleCategoryActive);

// ✅ IMAGE (ADMIN ONLY)
router.patch(
  "/:id/image",
  protect,
  allowedTo("admin"),
  uploadSingleImage,
  uploadCategoryImage
);

router.delete("/:id/image", protect, allowedTo("admin"), removeCategoryImage);

export default router;
