import neo4j, { Driver, Session } from "neo4j-driver";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
  if (!driver) {
    throw new Error("Neo4j driver not initialized");
  }
  return driver;
}

export async function initNeo4j(): Promise<Driver> {
  if (driver) {
    return driver;
  }

  driver = neo4j.driver(env.NEO4J_URI, neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD));
  await driver.verifyAuthentication();

  await ensureConstraints();
  logger.info("Neo4j driver initialized", { uri: env.NEO4J_URI, database: env.NEO4J_DATABASE });
  return driver;
}

async function ensureConstraints(): Promise<void> {
  const session = getSession();
  try {
    const statements = [
      "CREATE CONSTRAINT dataset_nodekey IF NOT EXISTS FOR (n:Dataset) REQUIRE n.nodeKey IS UNIQUE",
      "CREATE CONSTRAINT document_nodekey IF NOT EXISTS FOR (n:Document) REQUIRE n.nodeKey IS UNIQUE",
      "CREATE CONSTRAINT tag_nodekey IF NOT EXISTS FOR (n:Tag) REQUIRE n.nodeKey IS UNIQUE",
    ];
    for (const text of statements) {
      await session.run(text);
    }
  } finally {
    await session.close();
  }
}

export function getSession(accessMode: "READ" | "WRITE" = "WRITE"): Session {
  const mode = accessMode === "READ" ? neo4j.session.READ : neo4j.session.WRITE;
  return getNeo4jDriver().session({ database: env.NEO4J_DATABASE, defaultAccessMode: mode });
}

export async function closeNeo4j(): Promise<void> {
  if (!driver) return;
  await driver.close();
  driver = null;
}
