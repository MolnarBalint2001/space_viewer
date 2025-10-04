import { type Request, type Response, type NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema<any>, where: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[where]);
    if (!result.success) {
      next(result.error);
    } else {
      // felülírjuk a tisztított értékekkel
      (req as any)[where] = result.data;
      next();
    }
  };
