// src/utils/tokens.ts
import crypto from 'crypto';
export function createEmailVerifyToken() {
  const token = crypto.randomBytes(32).toString('hex');     // ezt küldjük e-mailben
  const hash  = crypto.createHash('sha256').update(token).digest('hex'); // ezt tároljuk
  return { token, hash };
}