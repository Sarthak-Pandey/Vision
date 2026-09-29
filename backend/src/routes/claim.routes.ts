import { Router } from 'express';
import { ClaimController } from '../controllers/claim.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createClaimSchema } from '../schemas/claim.schema.js';

const router = Router({ mergeParams: true });
const controller = new ClaimController();

// All claim endpoints require authentication
router.use(authenticate);

router.get('/', controller.getClaims);
router.get('/:claimId', controller.getClaimById);
router.post('/sync', controller.syncClaims);
router.post('/', validate(createClaimSchema), controller.createClaim);

export default router;
