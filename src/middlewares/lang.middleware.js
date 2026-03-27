import { createRequire } from "module";
const require = createRequire(import.meta.url);

const ar = require("../locales/ar.json");
const en = require("../locales/en.json");

export const langMiddleware = (req, res, next) => {
  const header = req.headers["accept-language"] || "en";
  const lang = header.toLowerCase().startsWith("ar") ? "ar" : "en";

  req.lang = lang;
  req.t = lang === "ar" ? ar : en;

  next();
};
