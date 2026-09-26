import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new AssetController();

router.use(authenticate);

router.get('/', controller.getAssets);

export default router;
