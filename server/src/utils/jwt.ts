import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function signJwt(payload: object) {

    return jwt.sign(payload, env.ADMIN_JWT_SECRET as string, {
        expiresIn: (env.ADMIN_JWT_EXPIRES_IN as any) || '1d',
        algorithm: "HS384"
    });
}