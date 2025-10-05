import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = "documents";

const client = new QdrantClient({ url: "http://localhost:6333" });

export async function ensureCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });
    console.log(`? Created collection '${COLLECTION_NAME}'`);
  } else {
    console.log(`?? Collection '${COLLECTION_NAME}' already exists`);
  }
}

export async function saveEmbedding(datasetId: string, embeddingArray: number[], name: string, description: string) {
  await client.upsert(COLLECTION_NAME, {
    points: [
      {
        id: datasetId,
        vector: embeddingArray,
        payload: {
          name,
          description,
        },
      },
    ],
  });
}

export async function getEmbedding(datasetId: string) {
  const points = await client.retrieve(COLLECTION_NAME, {
    ids: [datasetId],
    with_vector: true,
  });

  if (!points?.length) {
    return null;
  }

  const vector = points[0]?.vector;
  if (!vector) {
    return null;
  }

  if (Array.isArray(vector)) {
    return vector.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  }

  return Object.values(vector)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

export async function querySimilarEmbeddings(embeddingArray: number[], limit = 5, excludeIds: string[] = []) {
  const filter = excludeIds.length
    ? {
        must_not: [{ has_id: excludeIds }],
      }
    : undefined;


    console.log("Filter" + filter)
  const results = await client.search(COLLECTION_NAME, {
    vector: embeddingArray,
    limit,
    with_payload: true,
    filter,
  });

  return results.map((point) => ({
    id: typeof point.id === "number" ? point.id.toString() : String(point.id),
    score: point.score ?? null,
    payload: (point.payload ?? {}) as { title?: string; description?: string },
  }));
}
