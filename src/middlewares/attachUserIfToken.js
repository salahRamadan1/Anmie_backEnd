// middlewares/attachUserIfToken.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const attachUserIfToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) return next(); // ✅ public

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded.id);

    if (user) req.user = user; // ✅ attach
    next();
  } catch (e) {
    // لو token غلط/منتهي: نعامل الطلب كأنه public (مش نكسره)
    next();
  }
};
