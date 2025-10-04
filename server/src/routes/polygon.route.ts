import { Router } from "express";
import * as PolygonController from "../controllers/polygon.controller";


const router = Router();

router.post("", PolygonController.create);
router.get("", PolygonController.getAll);

export default router;