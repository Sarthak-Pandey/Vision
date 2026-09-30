import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';

const authService = new AuthService();

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const demoHeader = req.headers['x-demo-user'];

    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (demoHeader) {
      // Support explicit demo mode ONLY when explicitly enabled via env and not in production
      const isDemoAllowed =
        process.env.ALLOW_DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';

      if (isDemoAllowed) {
        const demoVal = String(demoHeader).trim();
        token = demoVal.startsWith('user-demo-') || demoVal.startsWith('demo-')
          ? demoVal
          : 'user-demo-123';
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    const user = await authService.verifyToken(token);
    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
};

