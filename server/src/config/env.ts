import path from "path";
import { z } from "zod";


import dotenv from "dotenv";
console.log(dotenv)
dotenv.config({ path: ".env" }); // <-- betölti a futásidőben elérhető .env fájlt

const EnvSchema = z.object({
  
  // Alap configok
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Adatbázis configok
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('app'),
  DB_SSL: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),

  // Redis confiok
  REDIS_URL: z.string().default('redis://localhost:6379'),


  ADMIN_JWT_SECRET: z.string().min(16).default('dev_secret_change_me'),
  ADMIN_JWT_EXPIRES_IN: z.string().default('1d'),

  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  // MinIO / S3-compatible storage
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('app-bucket'),
  MINIO_PRESIGN_EXPIRES: z.coerce.number().default(900), // seconds

  
});


export const env = EnvSchema.parse(process.env);
