import { randomUUID } from 'crypto';
import { type Request, type Response, type NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id']?.toString() || randomUUID();
  (req as any).id = id;
  res.setHeader('x-request-id', id);
  next();
}
