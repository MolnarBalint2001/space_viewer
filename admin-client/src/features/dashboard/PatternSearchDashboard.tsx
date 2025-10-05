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
  return new Intl.DateTimeFormat("hu-HU", {
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
            Nincs előnézet elérhető
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
            Fájl azonosító: <span className="font-mono">{result.datasetFileId}</span>
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
              Előnézet megnyitása
            </a>
          ) : null}
          {starsHref ? (
            <a
              className="rounded border border-slate-600 px-3 py-3 font-medium text-slate-200 transition hover:border-slate-500"
              href={starsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Csillagtérkép
            </a>
          ) : null}
          <Link to={mapHref}>
            <Button label="Megnyitás térképen" icon="pi pi-map" size="small" />
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
          <span>Dataset csoport #{index + 1}</span>
          <span className="font-mono text-slate-400">{group.datasetId}</span>
        </div>
        <h2 className="text-2xl font-semibold text-white">{group.datasetName}</h2>
        <p className="text-xs text-slate-400">
          Futások: {group.runs.length} · Utolsó futás: {formatDateTime(latestRun.createdAt)}
        </p>
        <Link to={buildRunMapUrl(latestRun)} className="text-xs text-sky-400 hover:underline">
          Megnyitás a térképen
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Összesített találat</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400">
            {totalSuccess} / {totalFiles}
          </p>
          <p className="text-xs text-slate-500">Sikeres fájlok a datasetben</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Átlagos futási idő</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{Math.round(avgDurationMs)} ms</p>
          <p className="text-xs text-slate-500">{runsSorted.length} run átlaga</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Legutóbbi beállítás</p>
          <p className="mt-2 text-sm text-slate-300">
            Score threshold: <span className="font-semibold text-slate-100">{formatNumber(latestRun.scoreThreshold)}</span>
          </p>
          <p className="text-xs text-slate-500">Verifikáció tolerancia: {formatNumber(latestRun.verifyTolPx, 2)} px</p>
        </div>
        <div className="rounded border border-slate-700 bg-slate-900/50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Futások száma</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{runsSorted.length}</p>
          <p className="text-xs text-slate-500">Legutóbbi run: {formatDateTime(latestRun.createdAt)}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Talált minták</h3>
          <span className="text-xs text-slate-400">{resultsSorted.length} sikeres találat összesen</span>
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
            Ehhez a datasethez nincs sikeres találat.
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
    console.error("Nem sikerült lekérni a mentett futásokat", error);
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
        <h1 className="text-2xl font-semibold text-white">Mintakeresés összefoglaló</h1>
        <p className="text-sm text-slate-400">
          Nincs elérhető futási eredmény. Futtass egy mintakeresést a Map Viewer oldalon, majd térj vissza ide a részletekhez.
        </p>
        <Link to={routes.mapViewer}>
          <Button label="Ugrás a Map Viewerre" icon="pi pi-arrow-right" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-8 p-6 text-slate-200">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Mintakeresések összefoglaló</h1>
        <p className="text-sm text-slate-400">
          Legutóbbi {primaryGroups.length} dataset részletesen.
        </p>
      </header>

      <div className="space-y-8">
        {primaryGroups.map((group, idx) => (
          <DatasetGroupDetail key={group.datasetId} group={group} index={idx} />
        ))}
      </div>

      {secondaryGroups.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">További kutatások</h2>
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
                  <div className="mt-1 text-xs text-slate-400">Futások: {group.runs.length}</div>
                  <div className="mt-1 text-xs text-emerald-400">
                    Legutóbbi találat: {latestRun.successCount} / {latestRun.totalFiles}
                  </div>
                  <Link
                    to={buildRunMapUrl(latestRun)}
                    className="mt-3 inline-block text-xs text-sky-400 hover:underline"
                  >
                    Megtekintés a térképen
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
