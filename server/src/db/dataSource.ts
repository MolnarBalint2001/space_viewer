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
import "reflect-metadata";



export const AppDataSource = new DataSource({
  type: "postgres",
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
    "src/db/migrations/*.ts",
  ],
});

if ((AppDataSource.driver as any)?.options?.type === "postgres") {
  const driver = AppDataSource.driver as any;
  const typeName = "vector";
  const arrays = [
    "supportedDataTypes",
    "withLengthColumnTypes",
    "withPrecisionColumnTypes",
    "withScaleColumnTypes",
    "spatialTypes",
  ];

  arrays.forEach((key) => {
    const arr = (driver as any)[key];
    if (Array.isArray(arr) && !arr.includes(typeName)) {
      arr.push(typeName);
    }
  });

  const defaults = (driver as any).dataTypeDefaults ?? {};
  if (!defaults[typeName]) {
    defaults[typeName] = { length: 384 };
  }
  (driver as any).dataTypeDefaults = defaults;
}
