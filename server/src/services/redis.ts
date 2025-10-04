import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const redis = createClient({ url: env.REDIS_URL });

redis.on('error', (err) => logger.error('Redis error', { err }));
redis.on('connect', () => logger.info('Redis connecting...'));
redis.on('ready', () => logger.info('Redis ready'));

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
    }
}
