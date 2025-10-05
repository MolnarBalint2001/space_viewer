import { createHash } from "node:crypto";
import { Node, Relationship } from "neo4j-driver";
import { logger } from "../utils/logger";
import { getSession } from "./neo4j.service";

export type GraphNodeType = "dataset" | "document" | "tag";

export interface AttachmentGraphInput {
  datasetId: string;
  datasetName: string | null;
  attachmentId: string;
  attachmentName: string;
  ownerId: string;
  tags: string[];
}

export interface GraphNodeDto {
  key: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, any>;
}

export interface GraphEdgeDto {
  id: string;
  type: string;
  from: string;
  to: string;
  properties: Record<string, any>;
}

export interface GraphResponse {
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
}

export interface GraphFetchParams {
  nodeKey: string;
  ownerId: string;
  depth: number;
}

export function buildDatasetNodeKey(datasetId: string): string {
  return `dataset:${datasetId}`;
}

export function buildDocumentNodeKey(attachmentId: string): string {
  return `document:${attachmentId}`;
}

export function buildTagNodeKey(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = normalized || "tag";
  const hash = createHash("sha1").update(name.toLowerCase()).digest("hex").slice(0, 6);
  return `tag:${base}-${hash}`;
}

function currentTimestamp(): string {
  return new Date().toISOString();
}

export function resolveNodeKey(type: GraphNodeType, id: string): string {
  switch (type) {
    case "dataset":
      return buildDatasetNodeKey(id);
    case "document":
      return buildDocumentNodeKey(id);
    case "tag":
      return id.startsWith("tag:") ? id : buildTagNodeKey(id);
    default:
      return id;
  }
}

export async function upsertAttachmentGraph(input: AttachmentGraphInput): Promise<void> {
  const session = getSession("WRITE");
  const datasetKey = buildDatasetNodeKey(input.datasetId);
  const documentKey = buildDocumentNodeKey(input.attachmentId);
  const timestamp = currentTimestamp();
  const tags = Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean)));
  const tagPayload = tags.map((tag) => ({
    name: tag,
    slugKey: buildTagNodeKey(tag),
  }));

  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `MERGE (dataset:Dataset { nodeKey: $datasetKey })
         SET dataset.datasetId = $datasetId,
             dataset.name = $datasetName,
             dataset.ownerId = $ownerId,
             dataset.updatedAt = datetime($timestamp)

         MERGE (doc:Document { nodeKey: $documentKey })
         SET doc.attachmentId = $attachmentId,
             doc.filename = $attachmentName,
             doc.datasetId = $datasetId,
             doc.ownerId = $ownerId,
             doc.updatedAt = datetime($timestamp)

         MERGE (dataset)-[rel:HAS_ATTACHMENT]->(doc)
         SET rel.ownerId = $ownerId,
             rel.updatedAt = datetime($timestamp)
        `,
        {
          datasetKey,
          datasetId: input.datasetId,
          datasetName: input.datasetName ?? "Ismeretlen kutatás",
          ownerId: input.ownerId,
          documentKey,
          attachmentId: input.attachmentId,
          attachmentName: input.attachmentName,
          timestamp,
        },
      );

      await tx.run(
        `MATCH (doc:Document { nodeKey: $documentKey })-[rel:TAGGED_AS]->(:Tag)
         DELETE rel`,
        { documentKey },
      );

      await tx.run(
        `MATCH (dataset:Dataset { nodeKey: $datasetKey })
         MATCH (doc:Document { nodeKey: $documentKey })
         WITH dataset, doc, $tags AS tags, $ownerId AS ownerId, $timestamp AS timestamp
         UNWIND tags AS tag
           MERGE (tagNode:Tag { nodeKey: tag.slugKey })
           SET tagNode.name = tag.name,
               tagNode.slug = tag.slugKey,
               tagNode.updatedAt = datetime(timestamp),
               tagNode.ownerIds = CASE
                 WHEN tagNode.ownerIds IS NULL THEN [ownerId]
                 WHEN NOT ownerId IN tagNode.ownerIds THEN tagNode.ownerIds + ownerId
                 ELSE tagNode.ownerIds
               END
           MERGE (doc)-[docRel:TAGGED_AS]->(tagNode)
           SET docRel.ownerId = ownerId,
               docRel.source = "openai",
               docRel.updatedAt = datetime(timestamp)
           MERGE (dataset)-[dsRel:ASSOCIATED_WITH]->(tagNode)
           SET dsRel.ownerId = ownerId,
               dsRel.updatedAt = datetime(timestamp)
        `,
        {
          datasetKey,
          documentKey,
          tags: tagPayload,
          ownerId: input.ownerId,
          timestamp,
        },
      );

      await tx.run(
        `MATCH (dataset:Dataset { nodeKey: $datasetKey })-[rel:ASSOCIATED_WITH]->(tag:Tag)
         WHERE NOT EXISTS {
           MATCH (dataset)-[:HAS_ATTACHMENT]->(:Document)-[:TAGGED_AS]->(tag)
         }
         DELETE rel`,
        { datasetKey },
      );
    });
  } catch (err) {
    logger.error("Neo4j attachment graph mentési hiba", {
      err,
      datasetId: input.datasetId,
      attachmentId: input.attachmentId,
    });
    throw err;
  } finally {
    await session.close();
  }
}

export async function fetchGraph(params: GraphFetchParams): Promise<GraphResponse> {
  const session = getSession("READ");
  const depth = Math.max(1, Math.min(params.depth, 10));
  try {
    const query = `
      MATCH (start { nodeKey: $nodeKey })
      WHERE start.ownerId = $ownerId OR ($ownerId IN coalesce(start.ownerIds, []))
      CALL {
        WITH start
        MATCH path = (start)-[*1..${depth}]-(n)
        WHERE all(x IN nodes(path) WHERE x.ownerId IS NULL OR x.ownerId = $ownerId OR $ownerId IN coalesce(x.ownerIds, []))
        RETURN collect(nodes(path)) AS nodePaths,
               collect(relationships(path)) AS relPaths
      }
      WITH start,
           REDUCE(acc = [], pathNodes IN nodePaths | acc + pathNodes) AS nodesFlat,
           REDUCE(acc = [], pathRels IN relPaths | acc + pathRels) AS relsFlat
      WITH start, nodesFlat + [start] AS nodeList, relsFlat AS relList
      UNWIND nodeList AS node
      WITH collect(DISTINCT node) AS nodes, relList
      UNWIND relList AS rel
      RETURN nodes, collect(DISTINCT rel) AS rels
    `;

    const result = await session.run(query, {
      nodeKey: params.nodeKey,
      ownerId: params.ownerId,
    });

    if (!result.records.length) {
      return { nodes: [], edges: [] };
    }

    const record = result.records[0];
    const rawNodes = (record.get("nodes") as Node[] | undefined) ?? [];
    const rawEdges = (record.get("rels") as Relationship[] | undefined) ?? [];

    const elementToNodeKey = new Map<string, string>();
    const mappedNodes = rawNodes
      .map((node) => {
        const mapped = mapNode(node);
        if (mapped) {
          const elementId = node.elementId ?? String(node.identity ?? mapped.key);
          elementToNodeKey.set(elementId, mapped.key);
        }
        return mapped;
      })
      .filter((node): node is GraphNodeDto => Boolean(node));

    const mappedEdges = rawEdges
      .map((edge) => mapEdge(edge, elementToNodeKey))
      .filter((edge): edge is GraphEdgeDto => Boolean(edge));

    return { nodes: mappedNodes, edges: mappedEdges };
  } catch (err) {
    logger.error("Neo4j graph lekérdezés hiba", { err, nodeKey: params.nodeKey });
    throw err;
  } finally {
    await session.close();
  }
}

export async function isNodeVisibleToOwner(
  nodeKey: string,
  ownerId: string,
): Promise<boolean> {
  const session = getSession("READ");
  try {
    const result = await session.run(
      `MATCH (node { nodeKey: $nodeKey })
       WHERE node.ownerId = $ownerId OR $ownerId IN coalesce(node.ownerIds, [])
       RETURN node LIMIT 1`,
      { nodeKey, ownerId },
    );
    return result.records.length > 0;
  } catch (err) {
    logger.error("Neo4j node jogosultság ellenőrzés hiba", { err, nodeKey, ownerId });
    throw err;
  } finally {
    await session.close();
  }
}

function mapNode(node: Node): GraphNodeDto | null {
  if (!node) return null;
  const labels: string[] = node.labels ?? [];
  const props = node.properties ?? {};
  const key = props.nodeKey ?? null;
  if (!key) return null;

  if (labels.includes("Dataset")) {
    return {
      key,
      type: "dataset",
      label: String(props.name ?? props.datasetId ?? "Dataset"),
      properties: props,
    };
  }

  if (labels.includes("Document")) {
    return {
      key,
      type: "document",
      label: String(props.filename ?? props.attachmentId ?? "Melléklet"),
      properties: props,
    };
  }

  if (labels.includes("Tag")) {
    return {
      key,
      type: "tag",
      label: String(props.name ?? props.slug ?? "Címke"),
      properties: props,
    };
  }

  return null;
}

function mapEdge(edge: Relationship, index: Map<string, string>): GraphEdgeDto | null {
  if (!edge) return null;
  const props = edge.properties ?? {};
  const startKey = index.get(edge.startNodeElementId ?? "");
  const endKey = index.get(edge.endNodeElementId ?? "");
  if (!startKey || !endKey) {
    return null;
  }

  return {
    id: edge.elementId ?? String(edge.identity ?? ""),
    type: edge.type,
    from: startKey,
    to: endKey,
    properties: props,
  };
}
