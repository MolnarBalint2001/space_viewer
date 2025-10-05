import type { FeatureCollection } from "geojson";
import { PATTERN_SERVICE_URL } from "../config/globals";

export type AssetPreference = "auto" | "mbtiles" | "original";

export interface LinePoint {
  x: number;
  y: number;
}

export interface PatternSearchStarParams {
  minSigma: number;
  maxSigma: number;
  numSigma: number;
  threshold: number;
  logScale: boolean;
}

export interface PatternSearchResultItem {
  id?: string;
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
  geojson?: FeatureCollection;
  createdAt?: string;
}

export interface PatternSearchRunResponse {
  id?: string;
  runId: string;
  datasetId: string;
  datasetName: string;
  patternName: string;
  linePoints: LinePoint[];
  starParams?: PatternSearchStarParams;
  verifyTolPx: number;
  scoreThreshold: number;
  assetPreference: AssetPreference;
  requestedFileIds?: string[] | null;
  usedFileIds: string[];
  successCount: number;
  totalFiles: number;
  durationMs: number;
  createdAt: string;
  storedAt?: string;
  results: PatternSearchResultItem[];
}

export const buildPreviewUrl = (relative?: string | null): string | null => {
  if (!relative) {
    return null;
  }
  if (/^https?:\/\//i.test(relative)) {
    return relative;
  }
  const base = PATTERN_SERVICE_URL.replace(/\/$/, "");
  const suffix = relative.startsWith("/") ? relative : `/${relative}`;
  return `${base}${suffix}`;
};
