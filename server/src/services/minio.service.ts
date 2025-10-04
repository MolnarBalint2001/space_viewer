import { Client as MinioClient } from 'minio';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

let client: MinioClient | null = null;

export function getMinioClient() {
  if (!client) {
    client = new MinioClient({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return client;
}

export async function ensureBucket(bucket = env.MINIO_BUCKET) {
  const c = getMinioClient();
  const exists = await c.bucketExists(bucket).catch((err) => {
    logger.error('MinIO bucketExists failed', { err });
    throw err;
  });
  if (!exists) {
    await c.makeBucket(bucket, '').catch((err) => {
      logger.error('MinIO makeBucket failed', { err, bucket });
      throw err;
    });
    logger.info('MinIO bucket created', { bucket });
  }
}

export async function putObject(
  objectName: string,
  data: Buffer | Readable | string,
  contentType?: string,
  bucket = env.MINIO_BUCKET,
) {
  const c = getMinioClient();
  const meta: Record<string, string> = {};
  if (contentType) meta['Content-Type'] = contentType;
  return c.putObject(bucket, objectName, data as any, undefined, meta);
}

export async function presignedGetUrl(objectName: string, expiresSec = env.MINIO_PRESIGN_EXPIRES, bucket = env.MINIO_BUCKET) {
  const c = getMinioClient();
  return c.presignedGetObject(bucket, objectName, expiresSec);
}

export async function presignedPutUrl(objectName: string, expiresSec = env.MINIO_PRESIGN_EXPIRES, bucket = env.MINIO_BUCKET) {
  const c = getMinioClient();
  return c.presignedPutObject(bucket, objectName, expiresSec);
}

export async function removeObject(objectName: string, bucket = env.MINIO_BUCKET) {
  const c = getMinioClient();
  return c.removeObject(bucket, objectName);
}

export async function listObjects(prefix = '', recursive = true, bucket = env.MINIO_BUCKET) {
  const c = getMinioClient();
  const stream = c.listObjects(bucket, prefix, recursive);
  const items: any[] = [];
  return new Promise<any[]>((resolve, reject) => {
    stream.on('data', (obj) => items.push(obj));
    stream.on('end', () => resolve(items));
    stream.on('error', (err) => reject(err));
  });
}

export async function initMinio() {
  const c = getMinioClient();
  // Simple call to verify connectivity
  try {
    await ensureBucket(env.MINIO_BUCKET);
    logger.info('MinIO initialized', { endpoint: env.MINIO_ENDPOINT, bucket: env.MINIO_BUCKET });
  } catch (err) {
    logger.error('MinIO initialization failed', { err });
    throw err;
  }
  return c;
}

export default {
  getMinioClient,
  ensureBucket,
  putObject,
  presignedGetUrl,
  presignedPutUrl,
  removeObject,
  listObjects,
  initMinio,
};

