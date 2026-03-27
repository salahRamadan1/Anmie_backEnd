import AppError from "../utils/AppError.js";

export const allowedTo = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError("Unauthorized", 401));

  const userRole = req.user.role; // لازم تكون موجودة في اليوزر
  if (!roles.includes(userRole)) return next(new AppError("Forbidden", 403));

  next();
};
