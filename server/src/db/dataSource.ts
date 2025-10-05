import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '../config/env';
import { AdminUser } from '../domain/entities/AdminUser';
import { Dataset } from '../domain/entities/Dataset';
import { DatasetFile } from '../domain/entities/DatasetFile';
import { DatasetAttachment } from '../domain/entities/DatasetAttachment';
import { Polygon } from '../domain/entities/Polygon';
import { PatternSearchRun } from '../domain/entities/PatternSearchRun';
import { PatternSearchResult } from '../domain/entities/PatternSearchResult';



export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.DB_SSL,
  synchronize: false,
  logging: false, //env.NODE_ENV !== 'production',
  entities: [
    AdminUser,
    Dataset,
    DatasetFile,
    DatasetAttachment,
    Polygon,
    PatternSearchRun,
    PatternSearchResult,
  ],
  migrations: [
    "src/db/migrations/*.ts"
  ],
});
