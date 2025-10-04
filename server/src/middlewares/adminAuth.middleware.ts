import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppDataSource } from '../db/dataSource';
import { User } from '../domain/entities/User';
import { NotFound, Unauthorized } from '../utils/error';
import { AdminUser } from '../domain/entities/AdminUser';
import { logger } from '../utils/logger';

type AuthOptions = {
  optional?: boolean;          // ha true: token hiányában is továbbenged (req.user nélkül)
  clockToleranceSec?: number;  // kis óracsúszás engedése
};

function extractBearerToken(req: Request): string | null {
  const h = req.headers.authorization || '';
  const m = h.match(/^(Bearer|Token)\s+(.+)$/i);
  return m ? m[2] : null;
}

const adminUserRepo = () => AppDataSource.getRepository(AdminUser);

/**
 * JWT auth middleware
 * - Ellenőrzi a Bearer tokent
 * - req.user-re rakja a payloadot
 * - Opcionálisan szerepkör(öke)t is vizsgál
 */
export function adminAuth(options: AuthOptions = {}) {
  const {
    optional = false,
    clockToleranceSec = 5,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    logger.debug(token)
    if (!token) {
      if (optional) return next();
      throw new Unauthorized("Hibás vagy lejárt token!")
    }

    try {
      const payload = jwt.verify(token, env.ADMIN_JWT_SECRET as string, {
        algorithms: ['HS384'],             // állítsd a valós algo-ra
        clockTolerance: clockToleranceSec, // kis tolerancia
      }) as any;

      const user = await adminUserRepo().findOneBy({ id: payload.id })
      if (!user) throw new NotFound("Nincs az azonosítóval admin felhasználó")

      req.user = user as any;
      req.token = token;



      return next();
    } catch (err: any) {
      logger.error(err)
      throw new Unauthorized("Hibás vagy lejárt token!")
    }
  };
}
