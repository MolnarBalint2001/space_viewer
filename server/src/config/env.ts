import { z } from "zod";


import dotenv from "dotenv";
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

  DATASET_LOCAL_TILE_DIR: z.string().default('../data/mbtiles'),
  TILESERVER_CONFIG_PATH: z.string().default('../data/mbtiles/config.json'),
  EMBEDDING_SERVICE_URL: z.string().default('http://localhost:8000'),
  TILESERVER_COMPOSE_FILE: z.string().default('../docker-compose.yml'),
  TILESERVER_COMPOSE_SERVICE: z.string().default('tileserver-gl'),

  // RabbitMQ
  RABBITMQ_URL: z.string().default('amqp://rabbit:rabbit@localhost:5672'),
  RABBITMQ_EXCHANGE: z.string().default('domain-events'),

  // OpenAI tagging
  OPENAI_API_KEY: z.string().min(10, 'OpenAI API kulcs szükséges'),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  ATTACHMENT_TAG_LIMIT: z.coerce.number().min(1).max(25).default(10),

  // Neo4j
  NEO4J_URI: z.string().default('neo4j://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('asdQWE123.'),
  NEO4J_DATABASE: z.string().default('neo4j'),

  
});


export const env = EnvSchema.parse(process.env);
