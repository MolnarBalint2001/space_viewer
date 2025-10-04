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

  // JWT beállítások
  JWT_SECRET: z.string().min(16).default('dev_secret_change_me'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  ADMIN_JWT_SECRET: z.string().min(16).default('dev_secret_change_me'),
  ADMIN_JWT_EXPIRES_IN: z.string().default('1d'),

  // Mailer config
  MAIL_HOST: z.string().default("smtp.gmail.com"),
  MAIL_PORT: z.coerce.number().default(465),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),
  MAIL_FROM: z.string().default("No-Reply teto-b2c-app"),
  EMAIL_VERIFY_TTL_SECONDS: z.coerce.number().default(86400),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_FEEDBACK_NOTIFY_EMAIL: z.string().email().optional(),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://localhost:5174')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  // Google OAuth / OIDC
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(10, 'Missing Google client id'),

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

  // Google Analytics 4 (opcionális, ha havi látogatókhoz használjuk)
  GA_PROPERTY_ID: z.string().optional(),
  GA_CLIENT_EMAIL: z.string().optional(),
  GA_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((value) => (value ? value.replace(/\\n/g, '\n') : undefined)),

    SHP_SERVICE_URL: z.string().default("http://localhost:8000")
});


export const env = EnvSchema.parse(process.env);
