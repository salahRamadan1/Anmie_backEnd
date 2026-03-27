import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const MONGO_URI = process.env.MONGO_URI;

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

async function seedCategories(count = 1000) {
  await mongoose.connect(MONGO_URI);

  const now = Date.now();

  const categories = Array.from({ length: count }, (_, i) => {
    const name = `Category ${i + 1}`;
    return {
      name,
      slug: `${slugify(name)}-${now}-${i}`, 
      order: i + 1,
      image: { url: "", publicId: "" }, 
      isActive: true,
    };
  });

  await Category.insertMany(categories, { ordered: false });

  console.log(`✅ ${count} Categories Inserted Successfully`);

  await mongoose.disconnect();
}

seedCategories(1000).catch((err) => {
  console.error("❌ Seed Error:", err.message);
  process.exit(1);
});
// terminal >> node src/scripts/seedCategories.js 