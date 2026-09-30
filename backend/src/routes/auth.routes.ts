import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

router.post('/login', controller.login);
router.post('/guest-login', controller.guestLogin);
router.get('/me', authenticate, controller.me);

export default router;
