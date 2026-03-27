import Product from "../models/Product.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsync.js";

const PRODUCT_SELECT = "_id title slug price priceAfterDiscount quantity isActive images";
export const addToWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) return next(new AppError("productId is required", 400));

  const product = await Product.findById(productId).select("_id");
  if (!product) return next(new AppError("Product not found", 404));

  const user = await User.findById(req.user._id).select("wishlist");
  if (!user) return next(new AppError("Unauthorized", 401));

  const exists = user.wishlist?.some((it) => String(it.product) === String(productId));

  if (exists) {
    return res.status(200).json({
      status: 200,
      message: "already_in_wishlist",
      wishlistCount: user.wishlist.length,
    });
  }

  user.wishlist.push({ product: productId, addedAt: new Date() });
  await user.save();

  res.status(201).json({
    status: 201,
    message: "added",
    wishlistCount: user.wishlist.length,
  });
});
export const getMyWishlist = catchAsyncError(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
  const sort = req.query.sort === "oldest" ? "oldest" : "newest";

  const user = await User.findById(req.user._id)
    .select("wishlist")
    .populate({ path: "wishlist.product", select: PRODUCT_SELECT });

  if (!user) return next(new AppError("Unauthorized", 401));

  let items = Array.isArray(user.wishlist) ? user.wishlist : [];

  // sort by addedAt
  items = items.sort((a, b) => {
    const da = new Date(a.addedAt || 0).getTime();
    const db = new Date(b.addedAt || 0).getTime();
    return sort === "newest" ? db - da : da - db;
  });

  const totalItems = items.length;
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  const mapped = paged.map((it) => mapWishlistProduct(it.product, it.addedAt));

  res.status(200).json({
    status: 200,
    items: mapped,
    pagination: { page, limit, totalItems, totalPages },
  });
});


export const removeFromWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id).select("wishlist");
  if (!user) return next(new AppError("Unauthorized", 401));

  const before = user.wishlist.length;

  user.wishlist = user.wishlist.filter((it) => String(it.product) !== String(productId));

  if (user.wishlist.length !== before) {
    await user.save();
  }

  res.status(200).json({
    status: 200,
    message: "removed",
    wishlistCount: user.wishlist.length,
  });
});

export const clearWishlist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("wishlist");
  if (!user) return next(new AppError("Unauthorized", 401));

  user.wishlist = [];
  await user.save();

  res.status(200).json({ status: 200, message: "cleared", wishlistCount: 0 });
});





export const toggleWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) return next(new AppError("productId is required", 400));

  const product = await Product.findById(productId).select("_id");
  if (!product) return next(new AppError("Product not found", 404));

  const user = await User.findById(req.user._id).select("wishlist");
  if (!user) return next(new AppError("Unauthorized", 401));

  const idx = user.wishlist.findIndex((it) => String(it.product) === String(productId));

  if (idx >= 0) {
    user.wishlist.splice(idx, 1);
    await user.save();
    return res.status(200).json({
      status: 200,
      action: "removed",
      wishlistCount: user.wishlist.length,
    });
  }

  user.wishlist.push({ product: productId, addedAt: new Date() });
  await user.save();

  res.status(200).json({
    status: 200,
    action: "added",
    wishlistCount: user.wishlist.length,
  });
});
export const checkInWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id).select("wishlist.product");
  if (!user) return next(new AppError("Unauthorized", 401));

  const inWishlist = user.wishlist?.some((it) => String(it.product) === String(productId));

  res.status(200).json({ status: 200, inWishlist: Boolean(inWishlist) });
});
const mapWishlistProduct = (p, addedAt) => {
  const mainImage = p?.images?.[0]?.url || null;
  const finalPrice = p?.priceAfterDiscount ?? p?.price ?? null;
  const isAvailable = Boolean(p?.isActive && (p?.quantity ?? 0) > 0);

  return {
    productId: p?._id ?? null,
    title: p?.title ?? null,
    slug: p?.slug ?? null,
    price: p?.price ?? null,
    priceAfterDiscount: p?.priceAfterDiscount ?? null,
    finalPrice,
    mainImage,
    isActive: Boolean(p?.isActive),
    quantity: p?.quantity ?? 0,
    isAvailable,
    addedAt: addedAt ?? null,
  };
};