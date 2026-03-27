import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsync.js";

const PRODUCT_SELECT =
    "_id title slug price priceAfterDiscount quantity isActive images";

const getUnitPrice = (p) =>
    (typeof p.priceAfterDiscount === "number" && p.priceAfterDiscount > 0)
        ? p.priceAfterDiscount
        : p.price;

const sameVariant = (it, { color = "", size = "" }) => (it.color || "") === (color || "") && (it.size || "") === (size || "");

async function recalc(cart) {
    const ids = cart.items.map((i) =>
        i.product?._id ? i.product._id : i.product
    );

    const products = await Product.find({ _id: { $in: ids } })
        .select(PRODUCT_SELECT);

    const map = new Map(products.map((p) => [String(p._id), p]));

    let subtotal = 0;

    for (const it of cart.items) {
        const productId = it.product?._id
            ? String(it.product._id)
            : String(it.product);

        const p = map.get(productId);
        if (!p || !p.isActive) continue;

        it.qty = Math.max(1, Math.min(it.qty, p.quantity));
        subtotal += getUnitPrice(p) * it.qty;
    }

    cart.subtotal = subtotal;
    cart.total = subtotal;

    await cart.save();
}


export const getMyCart = catchAsyncError(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product", PRODUCT_SELECT);

    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
        return res.status(200).json({ status: 200, cart });
    }

    await recalc(cart);
    cart = await Cart.findById(cart._id).populate("items.product", PRODUCT_SELECT);

    res.status(200).json({ status: 200, cart });
});

// POST /api/cart/items { productId, qty, color?, size? }
export const addItem = catchAsyncError(async (req, res, next) => {
    const { productId, qty = 1, color = "", size = "" } = req.body;
    if (!productId) return next(new AppError("productId is required", 400));

    const q = Math.max(parseInt(qty, 10) || 1, 1);

    const product = await Product.findById(productId).select(PRODUCT_SELECT);
    if (!product || !product.isActive) return next(new AppError("Product not found", 404));
    if (product.quantity < 1) return next(new AppError("Out of stock", 400));

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existing = cart.items.find(
        (it) => String(it.product) === String(productId) && sameVariant(it, { color, size })
    );

    if (existing) {
        existing.qty = Math.min(existing.qty + q, product.quantity);
    } else {
        cart.items.push({ product: productId, qty: Math.min(q, product.quantity), color, size });
    }

    await recalc(cart);

    const populated = await Cart.findById(cart._id).populate("items.product", PRODUCT_SELECT);
    res.status(200).json({ status: 200, message: "added", cart: populated });
});

// PATCH /api/cart/items/:itemId { qty }
export const updateQty = catchAsyncError(async (req, res, next) => {
    const { itemId } = req.params;
    const { qty } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError("Cart not found", 404));

    const item = cart.items.id(itemId);
    if (!item) return next(new AppError("Item not found", 404));

    const product = await Product.findById(item.product).select(PRODUCT_SELECT);
    if (!product || !product.isActive) return next(new AppError("Product not found", 404));

    const q = Math.max(parseInt(qty, 10) || 1, 1);
    item.qty = Math.min(q, product.quantity);

    await recalc(cart);

    const populated = await Cart.findById(cart._id).populate("items.product", PRODUCT_SELECT);
    res.status(200).json({ status: 200, message: "updated", cart: populated });
});

// DELETE /api/cart/items/:itemId
export const removeItem = catchAsyncError(async (req, res, next) => {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError("Cart not found", 404));

    const item = cart.items.id(itemId);
    if (!item) return next(new AppError("Item not found", 404));

    item.deleteOne();
    await recalc(cart);

    const populated = await Cart.findById(cart._id).populate("items.product", PRODUCT_SELECT);
    res.status(200).json({ status: 200, message: "removed", cart: populated });
});

// DELETE /api/cart/clear
export const clearCart = catchAsyncError(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    cart.items = [];
    cart.subtotal = 0;
    cart.total = 0;
    await cart.save();

    res.status(200).json({ status: 200, message: "cleared", cart });
});
