const middleWareHandlerErrorFun = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  const isDev = process.env.NODE_ENV !== "production";

  // ===============================
  // 1️⃣ Multer error
  // ===============================
  if (err.message === "Unexpected field") {
    statusCode = 400;
    message =
      req.lang === "ar"
        ? "الحد الأقصى لعدد الصور هو 3"
        : "Max count to upload images is 3";
  }

  // ===============================
  // 2️⃣ Mongo duplicate key (11000)
  // ===============================
  if (err.code === 11000) {
    statusCode = 409;

    // لو عندك key في الترجمة
    message =
      req?.t?.common?.duplicate ||
      (req.lang === "ar"
        ? "القيمة موجودة بالفعل"
        : "Duplicate field value");
  }

  // ===============================
  // 3️⃣ Mongoose ValidationError
  // ===============================
  if (err.name === "ValidationError") {
    statusCode = 400;

    const errors = Object.values(err.errors).map((e) => {
      const key = e.message;

      // لو الرسالة Key زي validation.user.email.required
      if (key?.startsWith("validation.")) {
        return getByPath(req.t, key) || key;
      }

      return key;
    });

    return res.status(statusCode).json({
      success: false,
      message:
        req.lang === "ar"
          ? "خطأ في التحقق من البيانات"
          : "Validation error",
      errors,
      ...(isDev && { stack: err.stack }),
    });
  }

  // ===============================
  // 4️⃣ Default error
  // ===============================
  res.status(statusCode).json({
    success: false,
    message: message || req?.t?.common?.serverError || "Server error",
    ...(isDev && { stack: err.stack }),
  });
};

export { middleWareHandlerErrorFun };

// ===============================
// Helper: getByPath
// ===============================
function getByPath(obj, path) {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}
