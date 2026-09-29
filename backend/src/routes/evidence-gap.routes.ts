import { Router } from 'express';
import { EvidenceGapController } from '../controllers/evidence-gap.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });
const controller = new EvidenceGapController();

// All evidence-gap endpoints require authentication
router.use(authenticate);

router.get('/', controller.getEvidenceGaps);

export default router;
