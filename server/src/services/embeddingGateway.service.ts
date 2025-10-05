import { In } from "typeorm";
import axios from "axios";
import { Dataset } from "../domain/entities/Dataset";
import { DatasetFile, DatasetFileStatus } from "../domain/entities/DatasetFile";
import { AppDataSource } from "../db/dataSource";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { saveEmbedding, querySimilarEmbeddings, getEmbedding } from "../clients/qdarant.client";
import { presignedGetUrl } from "./minio.service";

const datasetRepo = () => AppDataSource.getRepository(Dataset);
const datasetFileRepo = () => AppDataSource.getRepository(DatasetFile);

type EmbeddingPayload = {
  name?: string | null;
  description?: string | null;
};

type EmbeddingServiceResponse = {
  results?: Array<{
    embedding?: unknown;
  }>;
};

function normalizeEmbeddingVector(value: unknown): number[] | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    const numeric = value
      .map((num) => Number(num))
      .filter((num) => Number.isFinite(num));
    return numeric.length ? numeric : null;
  }
  return null;
}

function extractEmbeddingVector(response: EmbeddingServiceResponse): number[] {
  const candidate = response?.results?.[0]?.embedding;
  const embedding = normalizeEmbeddingVector(candidate);
  if (!embedding || !embedding.length) {
    throw new Error("Embedding service returned an empty embedding vector");
  }
  return embedding;
}

export type SimilarDatasetResult = {
  datasetId: string;
  name: string;
  description: string | null;
  score: number | null;
  createdAt: Date;
  previewImageUrl: string | null;
  tilesetKey: string | null;
};

async function buildPreviewMap(
  datasetIds: string[]
): Promise<Map<string, { previewImageUrl: string | null; tilesetKey: string | null }>> {
  const result = new Map<string, { previewImageUrl: string | null; tilesetKey: string | null }>();
  if (!datasetIds.length) {
    return result;
  }

  const files = await datasetFileRepo().find({
    where: { datasetId: In(datasetIds), status: DatasetFileStatus.READY },
    order: { createdAt: "DESC" },
  });

  for (const file of files) {
    if (result.has(file.datasetId)) {
      continue;
    }

    let previewUrl: string | null = null;
    if (file.previewImageKey) {
      try {
        previewUrl = await presignedGetUrl(file.previewImageKey);
      } catch (error) {
        logger.warn("Failed to create preview URL for similar dataset", {
          datasetFileId: file.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    result.set(file.datasetId, {
      previewImageUrl: previewUrl,
      tilesetKey: file.tilesetKey ?? null,
    });
  }

  return result;
}

export async function embedDataset(dataset: Dataset): Promise<void> {
  const payload: EmbeddingPayload = {
    name: dataset.name,
    description: dataset.description ?? null,
  };

  const response = await axios.post(
    `${env.EMBEDDING_SERVICE_URL}/embed`,
    { items: [payload] },
    { headers: { "Content-Type": "application/json" } }
  );

  const embedding = extractEmbeddingVector(response.data as EmbeddingServiceResponse);
  await saveEmbedding(dataset.id, embedding, dataset.name, dataset.description ?? "");
}

export async function searchSimilarDatasets(dataset: Dataset, limit = 5): Promise<SimilarDatasetResult[]> {
  const embedding = await getEmbedding(dataset.id);
  if (!embedding) {
    return [];
  }

  try {
    const similarPoints = await querySimilarEmbeddings(embedding, limit + 1, [dataset.id]);
    if (!similarPoints.length) {
      return [];
    }

    const uniqueIds: string[] = Array.from(
      new Set(
        similarPoints
          .map((point) => {
            const id = point.id;
            if (!id) {
              return null;
            }
            const normalized = String(id);
            return normalized === dataset.id ? null : normalized;
          })
          .filter((value): value is string => Boolean(value))
      )
    );

    if (!uniqueIds.length) {
      return [];
    }

    const datasets = await datasetRepo().find({ where: { id: In(uniqueIds) } });
    const datasetMap = new Map(datasets.map((item) => [item.id, item]));
    const previewMap = await buildPreviewMap(uniqueIds);

    const results: SimilarDatasetResult[] = [];

    for (const point of similarPoints) {
      const pointId = point.id ? String(point.id) : null;
      if (!pointId || pointId === dataset.id) {
        continue;
      }

      const match = datasetMap.get(pointId);
      if (!match) {
        continue;
      }

      const preview = previewMap.get(match.id);

      results.push({
        datasetId: match.id,
        name: match.name,
        description: match.description ?? null,
        score: point.score ?? null,
        createdAt: match.createdAt,
        previewImageUrl: preview?.previewImageUrl ?? null,
        tilesetKey: preview?.tilesetKey ?? null,
      });

      if (results.length >= limit) {
        break;
      }
    }

    return results;
  } catch (error) {
    logger.error("Failed to search similar datasets", {
      datasetId: dataset.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
