// controllers/product.controller.js
import mongoose from "mongoose";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import { catchAsyncError } from "../utils/catchAsync.js";
import cloudinary from "../utils/cloudinary.js";
import { toSlug } from "../utils/slugify.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";
import ApiFeatures from "../utils/ApiFeatures.js";

export const createProduct = catchAsyncError(async (req, res, next) => {
    const {
        title,
        description,
        type,
        price,
        priceAfterDiscount,
        quantity,
        images,
        category,
        sizes,
        colors,
        isActive,
    } = req.body;

    // ✅ حماية إضافية
    if (
        priceAfterDiscount != null &&
        price != null &&
        Number(priceAfterDiscount) >= Number(price)
    ) {
        return next(new AppError("priceAfterDiscount must be less than price", 400));
    }

    // ✅ منع التكرار: نفس title داخل نفس category (بالـ slug)
    const slug = toSlug(title, { lower: true, strict: true });

    const exists = await Product.findOne({ slug, category });
    if (exists) {
        return next(new AppError("Product already exists in this category", 409));
    }

    const product = await Product.create({
        title,
        description,
        type,
        price,
        priceAfterDiscount,
        quantity,
        images: images || [], // غالبًا هتسيبها فاضية وتضيفها بعدين
        category,
        sizes,
        colors,
        isActive,
    });

    res.status(201).json({
        status: 201,
        message: "Product created successfully",
        data: product,
    });
});

export const updateProduct = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    // 1) هات المنتج الأول
    const product = await Product.findById(id);
    if (!product) return next(new AppError("Product not found", 404));

    // 2) لو فيه title جديد → حدث slug
    if (req.body.title && req.body.title !== product.title) {
        const newSlug = toSlug(req.body.title, { lower: true, strict: true });

        // منع التكرار داخل نفس الكاتيجوري (لو الكاتيجوري هتتغير كمان)
        const targetCategory = req.body.category || product.category;

        const exists = await Product.findOne({
            _id: { $ne: id },
            slug: newSlug,
            category: targetCategory,
        });

        if (exists) {
            return next(new AppError("Product already exists in this category", 409));
        }

        product.slug = newSlug;
        product.title = req.body.title;
    }

    // 3) تحديث باقي الحقول (بدون images)
    const allowedFields = [
        "description",
        "type",
        "price",
        "priceAfterDiscount",
        "quantity",
        "sold",
        "category",
        "sizes",
        "colors",
        "isActive",
    ];

    for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
            product[key] = req.body[key];
        }
    }

    // 4) حماية الخصم
    const finalPrice = product.price;
    const finalDiscount = product.priceAfterDiscount;

    if (finalDiscount != null && finalDiscount >= finalPrice) {
        return next(new AppError("priceAfterDiscount must be less than price", 400));
    }

    await product.save();

    res.status(200).json({
        status: 200,
        message: "Product updated successfully",
        data: product,
    });
});
export const addProductImages = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return next(new AppError("Product not found", 404));

    if (!req.files || req.files.length === 0) {
        return next(new AppError("Please upload at least one image", 400));
    }

    if (product.images.length + req.files.length > 6) {
        return next(new AppError("Max images is 6", 400));
    }

    const uploaded = [];
    for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer, "anime-store/products");

        uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }

    product.images.push(...uploaded);
    await product.save();

    res.status(200).json({
        status: 200,
        message: "Images added successfully",
        data: product.images,
    });
});

// ✅ 2) Replace one images (delete old then upload new)
export const replaceOneProductImage = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { oldPublicId } = req.body;

    if (!oldPublicId) return next(new AppError("oldPublicId is required", 400));
    if (!req.file) return next(new AppError("Please upload an image", 400));

    const product = await Product.findById(id);
    if (!product) return next(new AppError("Product not found", 404));

    const idx = product.images.findIndex((img) => img.publicId === oldPublicId);
    if (idx === -1) return next(new AppError("Image not found in this product", 404));

    // delete old from cloudinary
    await cloudinary.uploader.destroy(oldPublicId);

    // upload new
    const result = await uploadBufferToCloudinary(req.file.buffer, "anime-store/products");

    product.images[idx] = {
        url: result.secure_url,
        publicId: result.public_id,
    };

    await product.save();

    res.status(200).json({
        status: 200,
        message: "Image replaced successfully",
        data: product.images,
    });
});

// ✅ 3) Delete one image by publicId
export const deleteProductImage = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { publicId } = req.body;

    if (!publicId) return next(new AppError("publicId is required", 400));

    const product = await Product.findById(id);
    if (!product) return next(new AppError("Product not found", 404));

    const exists = product.images.find((img) => img.publicId === publicId);
    if (!exists) return next(new AppError("Image not found in this product", 404));

    // delete from cloudinary
    await cloudinary.uploader.destroy(publicId);

    // remove from db
    product.images = product.images.filter((img) => img.publicId !== publicId);
    await product.save();

    res.status(200).json({
        status: 200,
        message: "Image deleted successfully",
        data: product.images,
    });
});

export const getProduct = catchAsyncError(async (req, res, next) => {
    const id = (req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid product id", 400));
    }

    const product = await Product.findById(id).populate("category", "name slug");

    if (!product) return next(new AppError("Product not found", 404));

    if (!product.isActive && req.user?.role !== "admin") {
        return next(new AppError("Product not found", 404));
    }

    res.status(200).json({ status: 200, data: product });
});


export const getAllProducts = catchAsyncError(async (req, res, next) => {
    const isAdmin = req.user?.role === "admin";

    // ✅ user يشوف active فقط
    const baseFilter = isAdmin ? {} : { isActive: true };

    // 1) total count (بنفس الفلاتر والبحث)
    const countFeatures = new ApiFeatures(Product.find(baseFilter), req.query)
        .filter()
        .search(["title", "description"]);

    const total = await Product.countDocuments(countFeatures.query.getFilter());

    // 2) data query
    const features = new ApiFeatures(Product.find(baseFilter), req.query)
        .filter()
        .search(["title", "description"])
        .sort("-createdAt")     // ده default بس لو req.query.sort موجود هيتطبق
        .select()
        .populate()
        .paginate(12, 100);

    const products = await features.query;

    res.status(200).json({
        status: 200,
        page: features.page,
        limit: features.limit,
        results: products.length, // count in this page
        total,                    // ✅ total matched
        data: products,
    });
});
export const getHome12Products = catchAsyncError(async (req, res, next) => {
    const isAdmin = req.user?.role === "admin";
    const baseFilter = isAdmin ? {} : { isActive: true };

    const features = new ApiFeatures(Product.find(baseFilter), req.query)
        .filter() // لو حابب تدعم filter خفيف (اختياري)
        .search(["title", "description"]) // اختياري
        .sort(req.query.sort || "-createdAt") // تقدر تغيّرها -sold لو عايز
        .select()
        .populate()
        .paginate(12, 12); // ✅ ثابت 12

    const products = await features.query;

    res.status(200).json({
        status: 200,
        results: products.length,
        data: products,
    });
});
export const getBestSellerProducts = catchAsyncError(async (req, res, next) => {
    const isAdmin = req.user?.role === "admin";

    // اليوزر يشوف active بس
    const baseFilter = isAdmin ? {} : { isActive: true };

    const limit = Math.min(Number(req.query.limit) || 10, 20); // default 10

    const products = await Product.find(baseFilter)
        .sort({ sold: -1, createdAt: -1 }) // 🔥 الأهم
        .limit(limit)
        .populate("category")
        .select("-__v");

    res.status(200).json({
        status: 200,
        results: products.length,
        data: products,
    });
});
export const toggleProductStatus = catchAsyncError(async (req, res, next) => {
    const id = (req.params.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError("Invalid product id", 400));
    }

    const product = await Product.findById(id);
    if (!product) return next(new AppError("Product not found", 404));

    product.isActive = !product.isActive;
    await product.save();

    res.status(200).json({
        status: 200,
        message: product.isActive
            ? "Product activated successfully"
            : "Product deactivated successfully",
        data: {
            _id: product._id,
            isActive: product.isActive,
        },
    });
});



export const getTopDealsProducts = catchAsyncError(async (req, res, next) => {
    const isAdmin = req.user?.role === "admin";
    const baseMatch = isAdmin ? {} : { isActive: true };

    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 30);

    const deals = await Product.aggregate([
        {
            $match: {
                ...baseMatch,
                price: { $gt: 0 },
                priceAfterDiscount: { $ne: null },
                $expr: { $lt: ["$priceAfterDiscount", "$price"] },
            },
        },
        {
            $addFields: {
                discountPercent: {
                    $round: [
                        {
                            $multiply: [
                                { $divide: [{ $subtract: ["$price", "$priceAfterDiscount"] }, "$price"] },
                                100,
                            ],
                        },
                        0,
                    ],
                },
            },
        },
        // ✅ أعلى خصم أولاً، ولو تعادل: الأرخص بعد الخصم، ولو تعادل: الأحدث
        { $sort: { discountPercent: -1, priceAfterDiscount: 1, createdAt: -1 } },
        { $limit: limit },

    ]);

    res.status(200).json({
        status: 200,
        results: deals.length,
        data: deals,
    });
});
