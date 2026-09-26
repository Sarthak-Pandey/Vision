import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

router.get('/me', authenticate, controller.me);

export default router;
