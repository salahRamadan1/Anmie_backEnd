import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getMyWishlist,
  toggleWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkInWishlist,
} from "../controllers/wishlist.controller.js";

const routerWishList = Router();

routerWishList.use(protect);

routerWishList.get("/", getMyWishlist);
routerWishList.post("/", addToWishlist);
routerWishList.delete("/", clearWishlist);
routerWishList.post("/toggle", toggleWishlist);


routerWishList.delete("/:productId", removeFromWishlist);
routerWishList.get("/check/:productId", checkInWishlist);

export default routerWishList;
