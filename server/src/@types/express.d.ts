import 'express';
import { AdminUser } from '../domain/entities/AdminUser';

declare global {
  namespace Express {
    interface Request {
      user?: AdminUser;
      token?: string;
    }
  }
}
export {}
