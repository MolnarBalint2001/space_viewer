import { AppDataSource } from "../db/dataSource";
import { Dataset } from "../domain/entities/Dataset";
import {
  PatternAssetPreference,
  PatternSearchRun,
} from "../domain/entities/PatternSearchRun";
import { PatternSearchResult } from "../domain/entities/PatternSearchResult";
import {
  PatternSearchRunDto,
  PatternSearchRunInput,
  PatternSearchRunListQuery,
  PatternSearchResultDto,
} from "../domain/dtos/patternSearch.dto";
import { NotFound } from "../utils/error";

const runRepo = () => AppDataSource.getRepository(PatternSearchRun);
const resultRepo = () => AppDataSource.getRepository(PatternSearchResult);
const datasetRepo = () => AppDataSource.getRepository(Dataset);

function toResultDto(entity: PatternSearchResult): PatternSearchResultDto {
  return {
    id: entity.id,
    datasetFileId: entity.datasetFileId,
    datasetFileName: entity.datasetFileName,
    assetKind: entity.assetKind,
    success: entity.success,
    score: entity.score,
    scoreAboveThreshold: entity.scoreAboveThreshold,
    previewPath: entity.previewPath ?? null,
    previewUrl: entity.previewUrl ?? null,
    starsPath: entity.starsPath ?? null,
    starsUrl: entity.starsUrl ?? null,
    transform: entity.transform ?? null,
    matchedPointsImage: entity.matchedPointsImage ?? null,
    message: entity.message ?? null,
    geojson: entity.geojson ?? null,
    createdAt: entity.createdAt.toISOString(),
  };
}

function toRunDto(entity: PatternSearchRun): PatternSearchRunDto {
  return {
    id: entity.id,
    runId: entity.runId,
    datasetId: entity.datasetId,
    datasetName: entity.datasetName,
    patternName: entity.patternName,
    linePoints: entity.linePoints,
    starParams: entity.starParams ?? null,
    verifyTolPx: entity.verifyTolPx,
    scoreThreshold: entity.scoreThreshold,
    assetPreference: entity.assetPreference,
    requestedFileIds: entity.requestedFileIds ?? null,
    usedFileIds: entity.usedFileIds,
    successCount: entity.successCount,
    totalFiles: entity.totalFiles,
    durationMs: entity.durationMs,
    createdAt: entity.createdAt.toISOString(),
    storedAt: entity.storedAt.toISOString(),
    results: (entity.results ?? []).map(toResultDto),
  };
}

export async function upsertPatternSearchRun(
  payload: PatternSearchRunInput,
): Promise<PatternSearchRunDto> {
  const dataset = await datasetRepo().findOne({ where: { id: payload.datasetId } });
  if (!dataset) {
    throw new NotFound("Dataset nem található");
  }

  const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();
  const requestedFileIds = payload.requestedFileIds ?? null;

  const existing = await runRepo().findOne({ where: { runId: payload.runId } });
  if (existing) {
    await runRepo().delete({ id: existing.id });
  }

  const run = runRepo().create({
    runId: payload.runId,
    datasetId: payload.datasetId,
    datasetName: payload.datasetName,
    patternName: payload.patternName,
    linePoints: payload.linePoints,
    starParams: payload.starParams ?? null,
    verifyTolPx: payload.verifyTolPx,
    scoreThreshold: payload.scoreThreshold,
    assetPreference: payload.assetPreference ?? PatternAssetPreference.AUTO,
    requestedFileIds,
    usedFileIds: payload.usedFileIds,
    successCount: payload.successCount,
    totalFiles: payload.totalFiles,
    durationMs: payload.durationMs,
    createdAt,
    results: payload.results.map((item) =>
      resultRepo().create({
        datasetFileId: item.datasetFileId,
        datasetFileName: item.datasetFileName,
        assetKind: item.assetKind,
        success: item.success,
        score: item.score,
        scoreAboveThreshold: item.scoreAboveThreshold,
        previewPath: item.previewPath ?? null,
        previewUrl: item.previewUrl ?? null,
        starsPath: item.starsPath ?? null,
        starsUrl: item.starsUrl ?? null,
        transform: item.transform ?? null,
        matchedPointsImage: item.matchedPointsImage ?? null,
        message: item.message ?? null,
        geojson: item.geojson ?? null,
      }),
    ),
  });

  const saved = await runRepo().save(run);
  return getPatternSearchRun(saved.runId);
}

export async function listPatternSearchRuns(
  query: PatternSearchRunListQuery,
): Promise<PatternSearchRunDto[]> {
  const { limit = 20, datasetId } = query;
  const take = Math.min(Math.max(limit, 1), 100);
  const runs = await runRepo().find({
    where: datasetId ? { datasetId } : {},
    relations: { results: true },
    order: { createdAt: "DESC" },
    take,
  });

  return runs.map((run) => {
    run.results = (run.results ?? []).sort((a, b) => b.score - a.score);
    return toRunDto(run);
  });
}

export async function getPatternSearchRun(runId: string): Promise<PatternSearchRunDto> {
  const run = await runRepo().findOne({
    where: { runId },
    relations: { results: true },
  });

  if (!run) {
    throw new NotFound("A keresési futás nem található");
  }
  run.results = (run.results ?? []).sort((a, b) => b.score - a.score);
  return toRunDto(run);
}
