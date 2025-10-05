import { Request, Response } from "express";
import {
  PatternSearchRunInput,
  PatternSearchRunListQuery,
} from "../domain/dtos/patternSearch.dto";
import {
  getPatternSearchRun,
  listPatternSearchRuns,
  upsertPatternSearchRun,
} from "../services/patternSearch.service";

export async function persistRun(req: Request, res: Response) {
  const body = req.body as PatternSearchRunInput;
  const saved = await upsertPatternSearchRun(body);
  return res.status(201).json(saved);
}

export async function listRuns(req: Request, res: Response) {
  const { limit, datasetId } = req.query as PatternSearchRunListQuery;
  const parsedLimit = limit !== undefined ? Number(limit) : undefined;
  const safeLimit = parsedLimit && Number.isFinite(parsedLimit) ? parsedLimit : undefined;
  const runs = await listPatternSearchRuns({
    limit: safeLimit,
    datasetId: datasetId ?? undefined,
  });
  return res.json({ items: runs });
}

export async function getRun(req: Request, res: Response) {
  const { runId } = req.params;
  const run = await getPatternSearchRun(runId);
  return res.json(run);
}
