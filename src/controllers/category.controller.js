import Category from "../models/Category.js";
import AppError from "../utils/AppError.js";
import ApiFeatures from "../utils/ApiFeatures.js";
import { toSlug } from "../utils/slugify.js";

import cloudinary from "../utils/cloudinary.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

/**
 * ✅ Create Category (ADMIN) - without image upload
 * body: { name, order?, isActive? }
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, order = 0, isActive = true } = req.body;

    if (!name?.trim()) return next(new AppError("Category name is required", 400));

    const cleanName = name.trim();
    const slug = toSlug(cleanName);

    const exist = await Category.findOne({ slug });
    if (exist) return next(new AppError("Category already exists", 409));

    const category = await Category.create({
      name: cleanName,
      slug,
      order: Number(order) || 0,
      isActive: String(isActive) === "true" || isActive === true,
      image: { url: "", publicId: "" },
    });

    res.status(201).json({
      message: "Category created",
      category,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Get All Categories (PUBLIC)
 * query supports: keyword, isActive, sort, page, limit, fields
 */
export const getCategories = async (req, res, next) => {
  try {
    const features = new ApiFeatures(Category.find(), req.query)
      .filter()
      .search(["name", "slug"])
      .sort("order")
      .select()
      .paginate(20);

    const items = await features.query;

    // count with same filter/search 
    const countQuery = new ApiFeatures(Category.find(), req.query)
      .filter()
      .search(["name", "slug"])
      .paginate(20);

    const total = await Category.countDocuments(
      countQuery.query.getFilter?.() || countQuery.query._conditions
    );

    res.json({
      total,
      page: features.page,
      limit: features.limit,
      pages: Math.ceil(total / features.limit),
      items,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Get One Category (PUBLIC)
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    res.json({ category });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Update Category (ADMIN) - without image
 * body: { name?, order?, isActive? }
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { name, order, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    if (typeof name !== "undefined") {
      const newName = name.trim();
      if (!newName) return next(new AppError("Category name cannot be empty", 400));

      const newSlug = toSlug(newName);

      const exist = await Category.findOne({
        slug: newSlug,
        _id: { $ne: category._id },
      });
      if (exist) return next(new AppError("Another category with same name exists", 409));

      category.name = newName;
      category.slug = newSlug;
    }

    if (typeof order !== "undefined") category.order = Number(order) || 0;

    if (typeof isActive !== "undefined") {
      category.isActive = String(isActive) === "true" || isActive === true;
    }

    await category.save();

    res.json({
      message: "Category updated",
      category,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Upload / Replace Category Image (ADMIN)
 * form-data: image (file)
 */
export const uploadCategoryImage = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) return next(new AppError("Category not found", 404));

    if (!req.file?.buffer) return next(new AppError("Image file is required", 400));

    // delete old image if exists
    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    // upload new
    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "anime-store/categories"
    );

    category.image = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await category.save();

    res.json({
      message: "Category image updated",
      category,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Remove Category Image (ADMIN)
 */
export const removeCategoryImage = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    category.image = { url: "", publicId: "" };
    await category.save();

    res.json({
      message: "Category image removed",
      category,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Delete Category (ADMIN) - also deletes image from cloudinary
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    await category.deleteOne();

    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * ✅ Toggle Active (ADMIN)
 */
export const toggleCategoryActive = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return next(new AppError("Category not found", 404));

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      message: "Category status changed",
      category,
    });
  } catch (err) {
    next(err);
  }
};
