import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../utils/errors.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = err.message || 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the 15MB limit';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    },
  });
};

