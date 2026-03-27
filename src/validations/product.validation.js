// validations/product.validation.js
import Joi from "joi";
import { translateJoiError } from "../utils/joiTranslator.js";

const objectId = (value, helpers) => {
  // 24 hex chars
  if (!/^[0-9a-fA-F]{24}$/.test(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

const allowedSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "ONE_SIZE"];
const allowedTypes = ["tshirt", "sweatshirt", "hoodie", "other"];

export const createProductSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required(),
  description: Joi.string().trim().min(10).max(2000).required(),

  type: Joi.string()
    .valid(...allowedTypes)
    .default("tshirt"),

  price: Joi.number().min(0).required(),
  priceAfterDiscount: Joi.number().min(0).optional(),

  quantity: Joi.number().integer().min(0).default(0),
  sold: Joi.number().integer().min(0).default(0),

  images: Joi.array().items(Joi.string().uri()).max(6).default([]),

  category: Joi.string().custom(objectId).required(),

  sizes: Joi.array()
    .items(Joi.string().valid(...allowedSizes))
    .default([]),

  colors: Joi.array().items(Joi.string().trim().min(1).max(30)).default([]),

  // اختياريين لو هتسيبهم للـ backend يحسبهم
  ratingsAverage: Joi.number().min(1).max(5).optional(),
  ratingsQuantity: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().default(true),
}).custom((obj, helpers) => {
  // priceAfterDiscount لازم تكون أقل من price
  if (
    obj.priceAfterDiscount != null &&
    obj.price != null &&
    obj.priceAfterDiscount >= obj.price
  ) {
    return helpers.message("priceAfterDiscount must be less than price");
  }
  return obj;
});

export const updateProductSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).optional(),
  description: Joi.string().trim().min(10).max(2000).optional(),

  type: Joi.string().valid(...allowedTypes).optional(),

  price: Joi.number().min(0).optional(),
  priceAfterDiscount: Joi.number().min(0).optional(),

  quantity: Joi.number().integer().min(0).optional(),
  sold: Joi.number().integer().min(0).optional(),

  images: Joi.array().items(Joi.string().uri()).max(6).optional(),

  category: Joi.string().custom(objectId).optional(),

  sizes: Joi.array().items(Joi.string().valid(...allowedSizes)).optional(),
  colors: Joi.array().items(Joi.string().trim().min(1).max(30)).optional(),

  ratingsAverage: Joi.number().min(1).max(5).optional(),
  ratingsQuantity: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().optional(),
})
  .min(1)
  .custom((obj, helpers) => {
    // لو الاتنين موجودين في نفس الريكوست
    if (
      obj.priceAfterDiscount != null &&
      obj.price != null &&
      obj.priceAfterDiscount >= obj.price
    ) {
      return helpers.message("priceAfterDiscount must be less than price");
    }
    return obj;
  });

export const productIdParamSchema = Joi.object({
  id: Joi.string().custom(objectId).required(),
});

export const getProductsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),

  // Filters
  category: Joi.string().custom(objectId).optional(),
  type: Joi.string().valid(...allowedTypes).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),

  // Search
  keyword: Joi.string().trim().min(1).max(60).optional(),

  // Sorting
  sort: Joi.string()
    .valid("newest", "priceAsc", "priceDesc", "topRated")
    .default("newest"),
}).custom((q, helpers) => {
  if (q.minPrice != null && q.maxPrice != null && q.minPrice > q.maxPrice) {
    return helpers.message("minPrice cannot be greater than maxPrice");
  }
  return q;
});
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });

    error ? res.status(201).json({ error: error.details }) : next()


  };
};

