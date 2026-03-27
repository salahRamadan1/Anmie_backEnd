import Joi from "joi";

export const wishlistAddSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
});

export const wishlistToggleSchema = wishlistAddSchema;

export const wishlistParamsSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
});

export const wishlistQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sort: Joi.string().valid("newest", "oldest").default("newest"),
});
