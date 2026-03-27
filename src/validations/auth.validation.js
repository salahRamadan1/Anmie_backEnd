import Joi from "joi";
import { translateJoiError } from "../utils/joiTranslator.js";
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(64).required(),
  phone: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(64).required(),
});
export const googleSchema = Joi.object({
  credential: Joi.string().min(20).required(), // ✅ idToken غالبًا طويل
});
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (!error) return next();

  const t = req.t; // ✅ هنا التعريف

  const errors = error.details.map((detail) => translateJoiError(detail, t));

  return res.status(400).json({
    success: false,
    message: req.lang === "ar" ? "خطأ في التحقق من البيانات" : "Validation error",
    errors,
  });
};
