import { Response } from 'express';

export interface ApiSuccessResponse<T = any> {
  traceId: string;
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  traceId: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const traceId = (res.req as any).traceId || 'unknown';
  res.status(statusCode).json({
    traceId,
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): void {
  const traceId = (res.req as any).traceId || 'unknown';
  res.status(statusCode).json({
    traceId,
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}
