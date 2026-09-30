import { Router } from 'express';
import { ConfidenceController } from '../controllers/confidence.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });
const controller = new ConfidenceController();

// Enforce authentication on all Phase 8 confidence endpoints
router.use(authenticate);

router.get('/', controller.getConfidenceReport);
router.post('/calculate', controller.calculateConfidence);

export default router;
