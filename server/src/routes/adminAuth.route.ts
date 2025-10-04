import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import * as AdminAuthController from "../controllers/adminAuth.controller";
import { AdminLoginDto } from "../domain/dtos/adminAuth.dto";

const router = Router();


router.post("/login", validate(AdminLoginDto), AdminAuthController.login)

export default router;