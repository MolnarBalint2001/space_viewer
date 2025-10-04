import { Router } from 'express';
import adminAuth from "./adminAuth.route";
import datasetRoutes from "./dataset.route";
import datasetPublicRoutes from "./datasetPublic.route";

import "express-async-errors";

const router = Router();


router.use("/admin/auth", adminAuth);
router.use("/admin/datasets", datasetRoutes);
router.use("/datasets", datasetPublicRoutes);
router.get('/health', (_, res) => res.json({ status: 'ok' }));

export default router;
