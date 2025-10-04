// src/utils/logger.ts
import winston from 'winston';

const { combine, timestamp, printf, colorize, splat, align } = winston.format;

const isProd = process.env.NODE_ENV === 'production';

// egységes formátum (reqId-t is ki tudjuk írni meta-ból)
const logFmt = printf(({ level, message, timestamp, ...meta }) => {
  const reqId = (meta as any)?.reqId || (meta as any)?.requestId;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}${reqId ? ` [${reqId}]` : ''}: ${message}${metaStr}`;
});

const consoleTransport = new winston.transports.Console({
  level: isProd ? 'info' : 'debug',
  format: combine(
    colorize({ all: !isProd }),
    timestamp(),
    splat(),
    align(),
    logFmt
  )
});



export const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: combine(timestamp(), splat(), align(), logFmt),
  transports: isProd ? [consoleTransport] : [consoleTransport],
  exitOnError: false
});

// morgan-hez kell egy stream, ami a logger http szintjére ír
export const httpStream = {
  write: (message: string) => {
    // morgan egy \n-t is ad, levágjuk
    logger.http(message.trim());
  }
};
