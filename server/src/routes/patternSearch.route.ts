import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import {
  getRun,
  listRuns,
  persistRun,
} from "../controllers/patternSearch.controller";
import { adminAuth } from "../middlewares/adminAuth.middleware";

const router = Router();

router.post("/runs", adminAuth(), persistRun);
router.get("/runs", adminAuth(), listRuns);
router.get("/runs/:runId", adminAuth(), getRun);

export default router;

