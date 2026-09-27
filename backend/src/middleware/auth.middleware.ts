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
      // Support explicit demo mode only when x-demo-user header is explicitly provided
      const demoVal = String(demoHeader).trim();
      token = demoVal.startsWith('user-demo-') || demoVal.startsWith('demo-')
        ? demoVal
        : 'user-demo-123';
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

