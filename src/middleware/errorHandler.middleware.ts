import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error occurred', {
    traceId: req.traceId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Input validation failed', details);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  // Handle Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      sendError(res, 409, 'CONFLICT', 'Resource already exists');
      return;
    }
    if (prismaErr.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }
  }

  // Handle JSON parse errors
  if ((err as any).type === 'entity.parse.failed') {
    sendError(res, 400, 'PARSE_ERROR', 'Invalid JSON in request body');
    return;
  }

  // Fallback: unknown errors
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
