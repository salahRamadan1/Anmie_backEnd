import express from "express";
import { getMyCart, addItem, updateQty, removeItem, clearCart } from "../controllers/cartController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyCart);
router.post("/items", addItem);
router.patch("/items/:itemId", updateQty);
router.delete("/items/:itemId", removeItem);
router.delete("/clear", clearCart);

export default router;
