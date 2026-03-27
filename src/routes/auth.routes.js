import { Router } from "express";
import { register, login, googleLogIn } from "../controllers/auth.controller.js";
import { validate, registerSchema, loginSchema, googleSchema } from "../validations/auth.validation.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleSchema), googleLogIn); 
router.get("/me", protect);

export default router;
