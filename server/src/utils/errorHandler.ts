import { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose from 'mongoose';
import logger from '../config/logger';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

/**
 * Centralized error handler for consistent error responses
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Format error response with appropriate details
 */
export function handleError(res: Response, error: unknown, defaultMessage: string): void {
  // Log the error with structured logging
  logger.error('API Error:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    defaultMessage,
  });

  // Check if it's our custom ApiError
  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      message: error.message,
      code: error.code,
    };

    if (process.env.NODE_ENV === 'development') {
      response.error = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Mongoose validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    const validationErrors = Object.values(error.errors).map(err => err.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      error: validationErrors.join(', '),
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
      code: 'INVALID_ID',
    });
    return;
  }

  // Handle duplicate key errors (MongoDB E11000)
  if (error instanceof Error && 'code' in error && error.code === 11000) {
    const duplicateError = error as { keyPattern?: Record<string, number> };
    const field = Object.keys(duplicateError.keyPattern || {})[0];
    res.status(409).json({
      success: false,
      message: `${field || 'Resource'} already exists`,
      code: 'DUPLICATE_ERROR',
    });
    return;
  }

  // Handle generic errors
  const response: ErrorResponse = {
    success: false,
    message: defaultMessage,
    code: 'INTERNAL_ERROR',
  };

  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.error = error.message;
  }

  res.status(500).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleError(res, error, 'An unexpected error occurred');
    });
  };
}
