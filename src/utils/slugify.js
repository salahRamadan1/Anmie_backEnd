export const toSlug = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "") // يسمح بالعربي
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
