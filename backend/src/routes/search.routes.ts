import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { semanticSearchSchema, backfillSchema } from '../schemas/search.schema.js';

const router = Router();
const controller = new SearchController();

// All search endpoints require authentication
router.use(authenticate);

router.post('/', validate(semanticSearchSchema), controller.search);
router.post('/index', validate(backfillSchema), controller.triggerIndexing);
router.get('/stats', controller.getIndexingStats);

export default router;
