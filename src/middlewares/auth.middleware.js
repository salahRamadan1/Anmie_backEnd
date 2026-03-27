import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) return next(new AppError("Unauthorized", 401));

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new AppError("Unauthorized", 401));

    req.user = user;
    next();
  } catch {
    next(new AppError("Unauthorized", 401));
  }
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403));
  }
  next();
};
