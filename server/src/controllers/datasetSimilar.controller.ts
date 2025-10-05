import { Request, Response } from "express";
import { AppDataSource } from "../db/dataSource";
import { DatasetFile } from "../domain/entities/DatasetFile";
import { Dataset } from "../domain/entities/Dataset";
import { BadRequest, NotFound } from "../utils/error";
import { searchSimilarDatasets } from "../services/embeddingGateway.service";

const datasetFileRepo = () => AppDataSource.getRepository(DatasetFile);
const datasetRepo = () => AppDataSource.getRepository(Dataset);

export async function findSimilarByTilesKey(req: Request, res: Response) {
  const tilesKey = (req.params.tilesKey || req.query.tilesKey || "").toString().trim();
  const limitParam = req.query.limit;
  const limit = limitParam ? Number(limitParam) : 5;
  const resolvedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 20) : 5;

  if (!tilesKey) {
    throw new BadRequest("tilesKey is required");
  }

  const datasetFile = await datasetFileRepo().findOne({
    where: { tilesetKey: tilesKey },
  });

  if (!datasetFile) {
    throw new NotFound("No dataset file found for the provided tilesKey");
  }

  const dataset = await datasetRepo().findOne({ where: { id: datasetFile.datasetId } });
  if (!dataset) {
    throw new NotFound("Dataset not found for the provided tilesKey");
  }

  const similar = await searchSimilarDatasets(dataset, resolvedLimit);
  return res.json({ items: similar });
}

