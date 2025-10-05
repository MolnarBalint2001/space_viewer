import { Router } from 'express';
import adminAuth from "./adminAuth.route";
import datasetRoutes from "./dataset.route";
import datasetPublicRoutes from "./datasetPublic.route";
import polygon from "./polygon.route";
import graphRoutes from "./graph.route";
import patternSearchRoutes from "./patternSearch.route";

import "express-async-errors";

const router = Router();


router.use("/admin/auth", adminAuth);
router.use("/admin/datasets", datasetRoutes);
router.use("/admin/graph", graphRoutes);
router.use("/datasets", datasetPublicRoutes);
router.get('/health', (_, res) => res.json({ status: 'ok' }));
router.use("/polygon", polygon);
router.use("/pattern-search", patternSearchRoutes);

export default router;
