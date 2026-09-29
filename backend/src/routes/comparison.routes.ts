import { Router } from 'express';
import { ComparisonController } from '../controllers/comparison.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { createComparisonSchema } from '../schemas/comparison.schema.js';

const router = Router({ mergeParams: true });
const controller = new ComparisonController();

// All comparison endpoints require authentication
router.use(authenticate);

router.post('/', validate(createComparisonSchema), controller.createComparison);
router.get('/', controller.getProjectComparisons);
router.get('/:id', controller.getComparisonById);

export default router;
