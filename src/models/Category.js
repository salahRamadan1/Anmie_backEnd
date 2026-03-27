import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // optional: للترتيب في الواجهة
    order: { type: Number, default: 0 },

    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // optional: تفعيل/إخفاء
    isActive: { type: Boolean, default: true },

    // لو عندك multi-tenant (TeacherId في مشروع تاني) تجاهل ده
    // ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });
// categorySchema.index({ slug: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
