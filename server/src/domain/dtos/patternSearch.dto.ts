import {
  PatternAssetPreference,
  PatternLinePoint,
  PatternStarParams,
} from "../entities/PatternSearchRun";

export interface PatternSearchResultInput {
  datasetFileId: string;
  datasetFileName: string;
  assetKind: string;
  success: boolean;
  score: number;
  scoreAboveThreshold: boolean;
  previewPath?: string | null;
  previewUrl?: string | null;
  starsPath?: string | null;
  starsUrl?: string | null;
  transform?: number[][] | null;
  matchedPointsImage?: number[][] | null;
  message?: string | null;
  geojson?: Record<string, unknown> | null;
}

export interface PatternSearchRunInput {
  runId: string;
  datasetId: string;
  datasetName: string;
  patternName: string;
  linePoints: PatternLinePoint[];
  starParams?: PatternStarParams | null;
  verifyTolPx: number;
  scoreThreshold: number;
  assetPreference: PatternAssetPreference;
  requestedFileIds?: string[] | null;
  usedFileIds: string[];
  successCount: number;
  totalFiles: number;
  durationMs: number;
  createdAt: string;
  results: PatternSearchResultInput[];
}

export interface PatternSearchRunListQuery {
  limit?: number;
  datasetId?: string;
}

export interface PatternSearchResultDto extends PatternSearchResultInput {
  id: string;
  createdAt: string;
}

export interface PatternSearchRunDto extends Omit<PatternSearchRunInput, "results" | "createdAt"> {
  id: string;
  createdAt: string;
  storedAt: string;
  results: PatternSearchResultDto[];
}

