import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import categoryRoutes from "./routes/category.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { middleWareHandlerErrorFun } from "./middlewares/error.middleware.js";
import { langMiddleware } from "./middlewares/lang.middleware.js";
import routerProduct from "./routes/product.routes.js";
import routerWishList from "./routes/wishlist.routes.js";
import routerCart from "./routes/cart.routes.js";

const app = express();

// Security
app.use(helmet());

// Rate Limit (اختياري)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests, please try again later.",
  })
);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Vite
    credentials: true,              // لو هتستخدم cookies لاحقًا
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(langMiddleware);
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", routerProduct);
app.use("/api/wishlist", routerWishList);
app.use("/api/cart", routerCart);
// Not found
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler
app.use(middleWareHandlerErrorFun);

export default app;
