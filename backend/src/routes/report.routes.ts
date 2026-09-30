import { Router } from 'express';
import { ImpactReportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });
const controller = new ImpactReportController();

// Enforce authentication on all Phase 9 Impact Report endpoints
router.use(authenticate);

router.get('/', controller.getProjectReport);

export default router;
