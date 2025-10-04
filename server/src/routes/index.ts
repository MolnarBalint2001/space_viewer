import { Router } from 'express';
import  adminAuth from "./adminAuth.route"

import "express-async-errors";

const router = Router();


router.use("/admin/auth", adminAuth)
router.get('/health', (_, res) => res.json({ status: 'ok' }));

export default router;
