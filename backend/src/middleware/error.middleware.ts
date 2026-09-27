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

  // Extract clean message if upstream error (e.g. Google GenAI) serialized a JSON response string
  try {
    const parsed = JSON.parse(message);
    if (parsed?.error?.message) {
      const providerCode = parsed.error.code;
      message = parsed.error.message;

      // Do not leak provider authentication/authorization status (401/403) as the application client's status.
      // Upstream provider failures are server-side dependency issues (502 Bad Gateway or 503 Service Unavailable).
      if (providerCode === 401 || providerCode === 403) {
        statusCode = 502; // Bad Gateway
        message = 'Vision AI service authentication failed. Please verify the server API key configuration.';
      } else if (providerCode === 429 || providerCode === 503) {
        statusCode = 503; // Service Unavailable
      } else if (providerCode === 404) {
        statusCode = 502; // Upstream resource not found
      } else if (typeof providerCode === 'number' && providerCode >= 500) {
        statusCode = providerCode;
      } else {
        statusCode = 502;
      }
    }
  } catch {
    // Message is plain string, keep as is
  }

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

