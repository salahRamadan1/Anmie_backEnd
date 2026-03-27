// models/Product.js
import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Product title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [120, "Title must be at most 120 characters"],
        },

        slug: {
            type: String,
            lowercase: true,
            index: true,
        },

        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
            minlength: [10, "Description must be at least 10 characters"],
            maxlength: [2000, "Description must be at most 2000 characters"],
        },

        // نوع المنتج (يساعدك في الفلترة: تيشرت / سويتشيرت)
        type: {
            type: String,
            enum: ["tshirt", "sweatshirt", "hoodie", "other"],
            default: "tshirt",
            index: true,
        },

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be >= 0"],
        },

        priceAfterDiscount: {
            type: Number,
            min: [0, "Price after discount must be >= 0"],
            validate: {
                validator: function (val) {
                    // لازم تكون أقل من السعر الأساسي
                    return val == null || val < this.price;
                },
                message: "priceAfterDiscount must be less than price",
            },
        },

        quantity: {
            type: Number,
            default: 0,
            min: [0, "Quantity must be >= 0"],
        },

        sold: {
            type: Number,
            default: 0,
            min: [0, "Sold must be >= 0"],
        },

        // صور المنتج (لينكات بعد الرفع)
        images: {
            type: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String, required: true },
                },
            ],
            default: [],
        },
        // categoryId
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"],
            index: true,
        },

        // مقاسات التيشرت/السويتشيرت
        sizes: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    const allowed = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "ONE_SIZE"];
                    return arr.every((s) => allowed.includes(s));
                },
                message: "Invalid size value",
            },
        },

        // ألوان متاحة
        colors: {
            type: [String],
            default: [],
        },

        // تقييمات (لو هتعمل reviews بعدين)
        ratingsAverage: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
            set: (val) => Math.round(val * 10) / 10, // 4.3
        },

        ratingsQuantity: {
            type: Number,
            default: 0,
            min: 0,
        },

        // يفضل للـ soft delete بدل ما تمسحه نهائي
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    { timestamps: true }
);

// Auto slug
 
productSchema.pre("save", function () {
    if (this.isModified("title")) {
        this.slug = slugify(this.title);
    }

    // ✅ normalize colors
    if (this.isModified("colors") && Array.isArray(this.colors)) {
        this.colors = this.colors
            .map((c) => String(c).trim().toLowerCase())
            .filter(Boolean);
    }

    // ✅ normalize sizes (اختياري)
    if (this.isModified("sizes") && Array.isArray(this.sizes)) {
        this.sizes = this.sizes
            .map((s) => String(s).trim().toUpperCase())
            .filter(Boolean);
    }
});
// productSchema.index({ slug: 1, category: 1 }, { unique: true });
// مفيد للبحث بالعنوان + الوصف
productSchema.index({ title: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
