import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

const authService = new AuthService();

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers['x-demo-user']) {
      token = 'demo-token';
    }

    // Allow requests during development/demo if token not strictly passed
    const user = await authService.verifyToken(token || 'demo-token');
    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
};
