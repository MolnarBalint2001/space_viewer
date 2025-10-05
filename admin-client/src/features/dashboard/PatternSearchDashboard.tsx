import axios from "axios";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { useAuth } from "../../components/AuthContext";
import { routes } from "../../config/routes";
import { API_URL } from "../../config/globals";
import {
  buildPreviewUrl,
  type PatternSearchResultItem,
  type PatternSearchRunResponse,
} from "../../types/patternSearch";

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
};

const formatNumber = (value: number, digits = 3): string =>
  Number.isFinite(value) ? value.toFixed(digits) : String(value);

const buildRunMapUrl = (run: PatternSearchRunResponse): string => {
  const params = new URLSearchParams({ datasetId: run.datasetId, name: run.datasetName });
  const firstSuccess = run.results.find((item) => item.success);
  if (firstSuccess) {
    params.set("fileId", firstSuccess.datasetFileId);
    params.set("fileName", firstSuccess.datasetFileName);
  }
  return `${routes.mapViewer}?${params.toString()}`;
};

const ResultCard = ({
  result,
  datasetId,
  datasetName,
  lineStringText,
}: {
  result: PatternSearchResultItem;
  datasetId: string;
  datasetName: string;
  lineStringText?: string;
}) => {
  const previewHref = buildPreviewUrl(result.previewUrl ?? result.previewPath ?? undefined);
  const starsHref = buildPreviewUrl(result.starsUrl ?? result.starsPath ?? undefined);
  const mapHref = buildMapLink(datasetId, datasetName, result.datasetFileId, result.datasetFileName);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60 shadow-sm">
      <div className="relative aspect-video w-full bg-slate-800/80">
        {previewHref ? (
          <img src={previewHref} alt={`${result.datasetFileName} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
            No preview available
          </div>
        )}
        <div className="absolute left-3 top-3 rounded bg-emerald-600/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-50">
          Score {formatNumber(result.score)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-sm text-slate-200">
        <div>
          <div className="text-base font-semibold text-white">{result.datasetFileName ?? result.datasetFileId}</div>
          <div className="mt-1 text-xs text-slate-400">
            File ID: <span className="font-mono">{result.datasetFileId}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Asset: <span className="uppercase">{result.assetKind}</span>
          </div>
          {lineStringText ? (
            <div className="mt-2 rounded border border-slate-700 bg-slate-900/50 p-2 text-[11px] font-mono text-slate-300">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">LineString</p>
              <pre className="mt-1 whitespace-pre-wrap break-words text-slate-200">{lineStringText}</pre>
            </div>
          ) : null}
        </div>
        {result.message ? (
          <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-200">
            {result.message}
          </div>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
          {previewHref ? (
            <a
              className="rounded bg-slate-700/60 px-3 py-3 font-medium text-slate-100 transition hover:bg-slate-600"
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open preview
            </a>
          ) : null}
          {starsHref ? (
            <a
              className="rounded border border-slate-600 px-3 py-3 font-medium text-slate-200 transition hover:border-slate-500"
              href={starsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Star map
            </a>
          ) : null}
          <Link to={mapHref}>
            <Button label="Open on map" icon="pi pi-map" size="small" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const buildMapLink = (
  datasetId: string,
  datasetName: string,
  fileId: string,
  fileName: string,
): string => {
  const params = new URLSearchParams({ datasetId, name: datasetName, fileId, fileName });
  return `${routes.mapViewer}?${params.toString()}`;
};

interface DatasetGroup {
  datasetId: string;
  datasetName: string;
  runs: PatternSearchRunResponse[];
}

const DatasetGroupDetail = ({ group, index }: { group: DatasetGroup; index: number }) => {
  const runsSorted = [...group.runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestRun = runsSorted[0];

  const totalSuccess = runsSorted.reduce((sum, run) => sum + run.successCount, 0);
  const totalFiles = runsSorted.reduce((sum, run) => sum + run.totalFiles, 0);
  const avgDurationMs =
    runsSorted.length > 0
      ? runsSorted.reduce((sum, run) => sum + run.durationMs, 0) / runsSorted.length
      : 0;

  const allResults = runsSorted.flatMap((run) =>
    run.results
      .filter((result) => result.success)
      .map((result) => ({ result, createdAt: run.createdAt, linePoints: run.linePoints })),
  );

  const resultsSorted = allResults.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <section className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
      <header className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
          <span>Dataset group #{index + 1}</span>
          <span className="font-mono text-slate-400">{group.datasetId}</span>
        </div>
        <h2 className="text-2xl font-semibold text-white">{group.datasetName}</h2>
        <p className="text-xs text-slate-400">
          Runs: {group.runs.length} · Last run: {formatDateTime(latestRun.createdAt)}
        </p>
        <Link to={buildRunMapUrl(latestRun)} className="text-xs text-sky-400 hover:underline">
          Open in map
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total matches</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {totalSuccess} / {totalFiles}
          </p>
          <p className="text-xs text-slate-500">Successful files in dataset</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average runtime</p>
          <p className="mt-2 text-2xl font-semibold text-orange-700">{Math.round(avgDurationMs)} ms</p>
          <p className="text-xs text-slate-500">Average across {runsSorted.length} runs</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Most recent settings</p>
          <p className="mt-2 text-sm text-slate-300">
            Score threshold: <span className="font-semibold text-cyan-500">{formatNumber(latestRun.scoreThreshold)}</span>
          </p>
          <p className="text-xs text-slate-500">Verification tolerance: {formatNumber(latestRun.verifyTolPx, 2)} px</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Number of runs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{runsSorted.length}</p>
          <p className="text-xs text-slate-500">Latest run: {formatDateTime(latestRun.createdAt)}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Detected patterns</h3>
          <span className="text-xs text-slate-400">{resultsSorted.length} successful matches total</span>
        </div>
        {resultsSorted.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {resultsSorted.map(({ result, linePoints }, idx) => {
              const lineStringText = linePoints
                .map((point, pointIndex) => `#${pointIndex + 1} ${point.x.toFixed(5)}, ${point.y.toFixed(5)}`)
                .join("\n");
              return (
                <ResultCard
                  key={`${group.datasetId}-${result.datasetFileId}-${idx}`}
                  result={result}
                  datasetId={group.datasetId}
                  datasetName={group.datasetName}
                  lineStringText={lineStringText}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
            This dataset has no successful matches.
          </div>
        )}
      </section>

    </section>
  );
};

const fetchPersistedRuns = async (token: string | null): Promise<PatternSearchRunResponse[]> => {
  if (!token) {
    return [];
  }
  try {
    const response = await axios.get<{ items: PatternSearchRunResponse[] }>(
      `${API_URL}/pattern-search/runs`,
      {
        params: { limit: 12 },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      },
    );
    return response.data.items ?? [];
  } catch (error) {
    console.error("Failed to fetch saved runs", error);
    return [];
  }
};

export const PatternSearchDashboard = () => {
  const { token } = useAuth();

  const { data: persistedRuns = [], isLoading } = useQuery({
    queryKey: ["pattern-search-runs", token],
    queryFn: () => fetchPersistedRuns(token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });

  const groupMap = new Map<string, DatasetGroup>();
  for (const run of persistedRuns) {
    const existing = groupMap.get(run.datasetId);
    if (existing) {
      existing.runs.push(run);
    } else {
      groupMap.set(run.datasetId, {
        datasetId: run.datasetId,
        datasetName: run.datasetName,
        runs: [run],
      });
    }
  }
  const sortedGroups = Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      runs: [...group.runs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.runs[0].createdAt).getTime() - new Date(a.runs[0].createdAt).getTime(),
    );

  const primaryGroups = sortedGroups.slice(0, 5);
  const secondaryGroups = sortedGroups.slice(5);

  if (isLoading && primaryGroups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <ProgressSpinner strokeWidth="4" />
      </div>
    );
  }

  if (!primaryGroups.length) {
    return (
      <div className="mx-auto space-y-6 p-8 text-slate-200">
        <h1 className="text-2xl font-semibold text-white">Pattern search summary</h1>
        <p className="text-sm text-slate-400">
          No run results available. Start a pattern search from the Map Viewer page, then return here for details.
        </p>
        <Link to={routes.mapViewer}>
          <Button label="Go to Map Viewer" icon="pi pi-arrow-right" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 p-6 text-slate-200">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Pattern searches overview</h1>
        <p className="text-sm text-slate-400">
          Latest {primaryGroups.length} datasets in detail.
        </p>
      </header>

      <div className="space-y-8">
        {primaryGroups.map((group, idx) => (
          <DatasetGroupDetail key={group.datasetId} group={group} index={idx} />
        ))}
      </div>

      {secondaryGroups.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Additional datasets</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {secondaryGroups.map((group) => {
              const latestRun = group.runs[0];
              return (
                <div key={group.datasetId} className="rounded border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{formatDateTime(latestRun.createdAt)}</span>
                    <span className="font-mono text-slate-500">{latestRun.runId.slice(0, 8)}…</span>
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">{group.datasetName}</div>
                  <div className="mt-1 text-xs text-slate-400">Runs: {group.runs.length}</div>
                  <div className="mt-1 text-xs text-emerald-400">
                    Latest result: {latestRun.successCount} / {latestRun.totalFiles}
                  </div>
                  <Link
                    to={buildRunMapUrl(latestRun)}
                    className="mt-3 inline-block text-xs text-sky-400 hover:underline"
                  >
                    View on map
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
};
