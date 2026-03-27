import mongoose from "mongoose";

export const connectDB = async (uri) => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ Mongo connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ Mongo connection error:", err.message);
    process.exit(1);
  }
};
