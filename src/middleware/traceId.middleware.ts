import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

export function traceIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  req.traceId = traceId;
  _res.setHeader('x-trace-id', traceId);
  next();
}
