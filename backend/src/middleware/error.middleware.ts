import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    },
  });
};
