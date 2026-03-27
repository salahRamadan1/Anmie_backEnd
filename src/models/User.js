import mongoose from "mongoose";
import bcrypt from "bcrypt";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    name: { type: String },
    phone: { type: String },
    city: { type: String, required: [true, "validation.address.city.required"] },
    area: { type: String },
    street: { type: String, required: [true, "validation.address.street.required"] },
    building: { type: String },
    floor: { type: String },
    apartment: { type: String },
    notes: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "validation.user.name.required"],
      trim: true,
      minlength: [2, "validation.user.name.minlength"],
    },

    email: {
      type: String,
      required: [true, "validation.user.email.required"],
      unique: true,
      lowercase: true,
      trim: true,
      // optional: basic regex (لو عايز)
      match: [/^\S+@\S+\.\S+$/, "validation.user.email.invalid"],
    },

    password: {
      type: String,
      minlength: [6, "validation.user.password.minlength"],
      select: false,
      required: function () {
        return this.provider === "local";
      },
    },

    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleSub: { type: String, unique: true, sparse: true },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },

    phone: { type: String, trim: true },

    avatar: {
      url: String,
      publicId: String,
    },

    addresses: [addressSchema],
    wishlist: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],


    lastLogin: { type: Date },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export default mongoose.model("User", userSchema);
