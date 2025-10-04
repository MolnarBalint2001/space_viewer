import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppDataSource } from '../db/dataSource';
import { User } from '../domain/entities/User';
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

const userRepo = () => AppDataSource.getRepository(User);

/**
 * JWT auth middleware
 * - Ellenőrzi a Bearer tokent
 * - req.user-re rakja a payloadot
 * - Opcionálisan szerepkör(öke)t is vizsgál
 */
export function auth(options: AuthOptions = {}) {
  const {
    optional = false,
    clockToleranceSec = 5,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);

    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing Bearer token' });
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET as string, {
        algorithms: ['HS384'],             // állítsd a valós algo-ra
        clockTolerance: clockToleranceSec, // kis tolerancia
      }) as any;

      const user = await userRepo().findOneBy({ id: payload.id })
      if (!user) throw new Error("User not found with id!")
      req.user = user;
      req.token = token;
      logger.info(user.email)



      return next();
    } catch (err: any) {
      const code = err?.name === 'TokenExpiredError' ? 401 : 401;
      return res.status(code).json({
        error: 'UNAUTHORIZED',
        message: err?.message || 'Invalid token'
      });
    }
  };
}
