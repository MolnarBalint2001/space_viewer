import "reflect-metadata";

import http from "http";
import app from "./app";
import { env } from "./config/env";
import initializeRabbitMqConsumers from "./consumers/init";
import { AppDataSource } from "./db/dataSource";
import { initRabbit } from "./services/rabbitmq.service";
import { connectRedis, redis } from "./services/redis";
import { logger } from "./utils/logger";
import { initMinio } from "./services/minio.service";
import { closeWebsocket, initWebsocket } from "./services/websocket.service";
import { closeNeo4j, initNeo4j } from "./services/neo4j.service";
import { ensureCollection } from "./clients/qdarant.client";
// Avoid logging env secrets in production

const port = env.PORT;

async function main() {
  try {
    logger.info('DataSource initialized');
    await AppDataSource.initialize();

    await connectRedis();
    logger.info("Redis connected")

    await initNeo4j();
    logger.info("Neo4j connected")

    await initRabbit()
    logger.info("RabbitMq connected")

    await initializeRabbitMqConsumers();
    logger.info("RabbitMq Consumers inited")

    await initMinio();
    logger.info("MinIO connected and bucket ready")

    await ensureCollection();
    logger.info("QDarant collection initialization")

    const server = http.createServer(app);
    initWebsocket(server);

    server.listen(port, () => {
      logger.info(`API listening on :${port} (${env.NODE_ENV})`);
    });

    const graceful = (signal: string) => {
      logger.warn('Shutting down...', { signal },);
      server.close(async () => {
        try {
          if (AppDataSource.isInitialized) await AppDataSource.destroy();
          logger.info('DB connection closed');
        } finally {
          closeWebsocket();
          await closeNeo4j().catch(() => undefined);
          process.exit(0);
        }
      });

      setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on('SIGTERM', () => graceful('SIGTERM'));
    process.on('SIGINT', () => graceful('SIGINT'));
  } catch (err) {
    logger.error('Boot failed ' + err, { err },);
    process.exit(1);
  }
}

main();
