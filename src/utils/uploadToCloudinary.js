import cloudinary from "./cloudinary.js";
import AppError from "../utils/AppError.js";

export const uploadBufferToCloudinary = (buffer, folder = "categories") =>
  new Promise((resolve, reject) => {
    // ✅ حماية: لازم folder يكون string
    if (typeof folder !== "string") {
      return reject(new AppError("Cloudinary folder must be a string", 500));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
