import { Router } from "express";
import { adminAuth } from "../middlewares/adminAuth.middleware";
import { getGraphByNode } from "../controllers/graph.controller";

const router = Router();

router.use(adminAuth());
router.get("/", getGraphByNode);

export default router;
