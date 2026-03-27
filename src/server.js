import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initCloudinary } from "./utils/cloudinary.js";

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);

// 🔥 مهم جدًا
initCloudinary();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
