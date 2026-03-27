class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.query = mongooseQuery;
    this.qs = queryString;
    this.page = 1;
    this.limit = 20;
  }

  paginate(defaultLimit = 20, maxLimit = 100) {
    const page = Math.max(parseInt(this.qs.page || "1", 10), 1);
    const limitRaw = parseInt(this.qs.limit || `${defaultLimit}`, 10);
    const limit = Math.min(Math.max(limitRaw, 1), maxLimit);
    const skip = (page - 1) * limit;

    this.page = page;
    this.limit = limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  filter() {
    const queryObj = { ...this.qs };
    const excluded = ["page", "sort", "keyword", "limit", "fields", "populate"];
    excluded.forEach((k) => delete queryObj[k]);

    const mongoFilter = {};

    Object.entries(queryObj).forEach(([rawKey, rawVal]) => {
      // rawKey ممكن يبقى: "price[gte]" أو "sizes[in]" أو "type"
      const match = rawKey.match(/^(.+)\[(gte|gt|lte|lt|in|ne)\]$/);

      if (!match) {
        // field عادي: type=tshirt , category=xxx
        mongoFilter[rawKey] = rawVal;
        return;
      }

      const field = match[1];      // price / sizes / colors
      const op = match[2];         // gte / in ...
      const mongoOp = `$${op}`;

      // تجهيز القيمة
      let value = rawVal;

      if (op === "in") {
        if (Array.isArray(value)) {
          value = value;
        } else if (typeof value === "string") {
          value = value.split(",").map((x) => x.trim()).filter(Boolean);
        }

        // ✅ Case-insensitive match for colors:
        if (field === "colors") {
          mongoFilter[field] = {
            $elemMatch: { $in: value.map((v) => new RegExp(`^${escapeRegex(v)}$`, "i")) }
          };
          return; // مهم: عشان ما يكملش تحت ويعمل $in تاني
        }
      } else {
        // أرقام: price[gte]=100
        if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
          value = Number(value);
        }
      }

      if (!mongoFilter[field]) mongoFilter[field] = {};
      mongoFilter[field][mongoOp] = value;
    });

    this.query = this.query.find(mongoFilter);
    return this;
  }

  search(fields = ["name"]) {
    if (this.qs.keyword?.trim()) {
      const keyword = this.qs.keyword.trim();
      const or = fields.map((f) => ({ [f]: { $regex: keyword, $options: "i" } }));
      this.query = this.query.find({ $or: or });
    }
    return this;
  }

  sort(defaultSort = "-createdAt") {
    const sortBy = this.qs.sort
      ? this.qs.sort.split(",").map((f) => f.trim()).join(" ")
      : defaultSort;

    this.query = this.query.sort(sortBy);
    return this;
  }

  select() {
    // fields=name,slug
    if (this.qs.fields) {
      const fields = this.qs.fields.split(",").map((f) => f.trim()).join(" ");
      this.query = this.query.select(fields);
    }
    return this;
  }

  populate() {
    // populate=categoryId:select=name slug
    // أو populate=categoryId
    if (this.qs.populate) {
      // بسيطة: populate=categoryId,brandId
      const paths = this.qs.populate.split(",").map((p) => p.trim());
      paths.forEach((p) => this.query = this.query.populate(p));
    }
    return this;
  }
}

export default ApiFeatures;
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}