import 'express';
import { User } from '../domain/entities/User';
import { AdminUser } from '../domain/entities/AdminUser';


declare global {
  namespace Express {
    interface Request {
      user: User | AdminUser;
      token?: string;
    }
  }
}
export {}
