import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { allowedTo } from "../middlewares/allowedTo.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  validate,
} from "../validations/product.validation.js";
import {
  addProductImages,
  createProduct,
  deleteProductImage,
  getAllProducts,
  getBestSellerProducts,
  getHome12Products,
  
  getProduct,
  getTopDealsProducts,
  replaceOneProductImage,
  toggleProductStatus,
  updateProduct,

} from "../controllers/product.controller.js";
import { uploadMultipleImages, uploadSingleImage } from "../middlewares/upload.middleware.js";
import { attachUserIfToken } from "../middlewares/attachUserIfToken.js";

const routerProduct = Router();

// 🔓 Public
routerProduct.get("/", attachUserIfToken, getAllProducts);
// routerProduct.get("/home", attachUserIfToken, getHomeProducts);
routerProduct.get("/deals", attachUserIfToken, getTopDealsProducts);
routerProduct.get("/home12", attachUserIfToken, getHome12Products);
routerProduct.get(
  "/best-sellers",
  attachUserIfToken, 
  getBestSellerProducts
);
routerProduct.get("/:id", getProduct);

// 🔐 Admin only

//    create product                      done 
routerProduct.post(
  "/",
  protect,
  allowedTo("admin"),
  validate(createProductSchema),
  createProduct
);
// update values product  done 
routerProduct.put(
  "/:id",
  protect,
  allowedTo("admin"),
  validate(updateProductSchema),
  updateProduct
);

// POST /products/:id/images  -> add images done
routerProduct.post(
  "/:id/images",
  protect,
  allowedTo("admin"),
  uploadMultipleImages,
  addProductImages
);
// PUT /products/:id/images -> replace all images   done
routerProduct.put(
  "/:id/images/:replace-one",
  protect,
  allowedTo("admin"),
  uploadSingleImage,
  replaceOneProductImage
);

// DELETE /products/:id/images -> delete one image done
routerProduct.delete(
  "/:id/images",
  protect,
  allowedTo("admin"),
  deleteProductImage
);
// routes/product.routes.js
routerProduct.patch(
  "/:id/toggle",
  protect,
  allowedTo("admin"),
  toggleProductStatus
);







export default routerProduct;
