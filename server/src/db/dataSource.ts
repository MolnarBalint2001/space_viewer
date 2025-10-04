import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { AdminUser } from '../domain/entities/AdminUser';
import { Polygon } from '../domain/entities/Polygon';



export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL,
  synchronize: false,
  logging: env.NODE_ENV !== 'production',
  entities: [
    AdminUser,
    Polygon
  ],
  migrations: [
    "src/db/migrations/*.ts"
  ],
});
