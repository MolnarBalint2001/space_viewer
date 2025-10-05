import { Request, Response } from "express";
import { AppDataSource } from "../db/dataSource";
import { Dataset } from "../domain/entities/Dataset";
import { NotFound, Forbidden, BadRequest } from "../utils/error";
import {
  buildDatasetNodeKey,
  buildDocumentNodeKey,
  fetchGraph,
  isNodeVisibleToOwner,
  resolveNodeKey,
} from "../services/graph.service";
import { ensureAttachmentOwnership } from "../repositories/datasetAttachment.repository";

const datasetRepo = () => AppDataSource.getRepository(Dataset);

function parseDepth(value: unknown, fallback = 3): number {
  const parsed = typeof value === "string" ? Number(value) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(10, Math.round(parsed)));
}

export async function getDatasetGraph(req: Request, res: Response) {
  const user = req.user as any;
  const datasetId = req.params.datasetId;
  const depth = parseDepth(req.query.depth, 3);

  const dataset = await datasetRepo().findOne({ where: { id: datasetId } });
  if (!dataset) throw new NotFound("A kutatás nem található");
  if (dataset.ownerId !== user?.id) throw new Forbidden("Ehhez a kutatáshoz nincs jogosultságod");

  const nodeKey = buildDatasetNodeKey(datasetId);
  const graph = await fetchGraph({ nodeKey, ownerId: user.id, depth });

  if (!graph.nodes.length) {
    const fallbackNode = {
      key: nodeKey,
      type: "dataset" as const,
      label: dataset.name ?? dataset.id,
      properties: {
        nodeKey,
        datasetId,
        name: dataset.name ?? dataset.id,
        ownerId: dataset.ownerId,
      },
    };
    return res.json({ root: nodeKey, depth, nodes: [fallbackNode], edges: [] });
  }

  return res.json({ root: nodeKey, depth, ...graph });
}

export async function getGraphByNode(req: Request, res: Response) {
  const user = req.user as any;
  const rawType = typeof req.query.type === "string" ? req.query.type : "";
  const rawId = typeof req.query.id === "string" ? req.query.id : "";
  const nodeKeyParam = typeof req.query.nodeKey === "string" ? req.query.nodeKey : undefined;
  const depth = parseDepth(req.query.depth, 3);

  if (!rawType || (!rawId && !nodeKeyParam)) {
    throw new BadRequest("A lekérdezéshez szükséges a type és id vagy nodeKey paraméter");
  }

  const type = rawType.toLowerCase() as "dataset" | "document" | "tag";
  if (!["dataset", "document", "tag"].includes(type)) {
    throw new BadRequest("Ismeretlen graf típus");
  }

  if (type === "dataset") {
    req.params.datasetId = nodeKeyParam && nodeKeyParam.startsWith("dataset:")
      ? nodeKeyParam.split(":")[1] ?? rawId
      : rawId;
    return getDatasetGraph(req, res);
  }

  if (type === "document") {
    const attachment = await ensureAttachmentOwnership(rawId, user.id);
    if (!attachment) {
      throw new NotFound("A melléklet nem érhető el");
    }
    const nodeKey = nodeKeyParam ?? buildDocumentNodeKey(attachment.id);
    const graph = await fetchGraph({ nodeKey, ownerId: user.id, depth });

    if (!graph.nodes.length) {
      const fallbackNode = {
        key: nodeKey,
        type: "document" as const,
        label: attachment.originalFilename,
        properties: {
          nodeKey,
          attachmentId: attachment.id,
          datasetId: attachment.datasetId,
          filename: attachment.originalFilename,
          ownerId: user.id,
        },
      };
      return res.json({ root: nodeKey, depth, nodes: [fallbackNode], edges: [] });
    }

    return res.json({ root: nodeKey, depth, ...graph });
  }

  // type === "tag"
  const nodeKey = nodeKeyParam ?? resolveNodeKey("tag", rawId);
  const visible = await isNodeVisibleToOwner(nodeKey, user.id);
  if (!visible) {
    throw new NotFound("A címke nem található vagy nem kapcsolódik a kutatásaidhoz");
  }
  const graph = await fetchGraph({ nodeKey, ownerId: user.id, depth });
  return res.json({ root: nodeKey, depth, ...graph });
}
