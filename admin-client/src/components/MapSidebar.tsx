import axios from 'axios';
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useMapSidebar } from './MapSidebarContext';
import { useToast } from './ToastContext';
import { PATTERN_SERVICE_URL } from '../config/globals';
import { useAuth } from './AuthContext';
import type { PatternSearchRunResponse } from '../types/patternSearch';
import { buildPreviewUrl } from '../types/patternSearch';
import { LabeledFeatures } from '../features/mapViewer/LabeledFeatures';
import { SimilarResearch } from '../features/mapViewer/SimilarResearch';
import { TabPanel, TabView } from 'primereact/tabview';
import { PatternSearchDashboard } from '../features/dashboard/PatternSearchDashboard';



export const MapSidebar = () => {
  const {
    isOpened,
    activeLineString,
    setActiveLineString,
    currentDataset,
    lastSearchResult,
    setLastSearchResult,
  } = useMapSidebar();
  const { token } = useAuth();
  const { notifyError, notifySuccess } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient();




  const [activeIndex, setActiveIndex] = useState(0);

  const linePointCount = activeLineString?.coordinates.length ?? 0;
  const canSearch = useMemo(() => {
    return Boolean(
      activeLineString &&
      linePointCount >= 2 &&
      currentDataset?.datasetId &&
      currentDataset.datasetFileId
    );
  }, [activeLineString, linePointCount, currentDataset]);


  const firstPoint = useMemo(() => {
    if (!activeLineString || linePointCount === 0) return null;
    return activeLineString.coordinates[0];
  }, [activeLineString, linePointCount]);

  const lastPoint = useMemo(() => {
    if (!activeLineString || linePointCount === 0) return null;
    return activeLineString.coordinates[linePointCount - 1];
  }, [activeLineString, linePointCount]);

  const handleClearLine = useCallback(() => {
    setActiveLineString(null);
    setLastSearchResult(null);
  }, [setActiveLineString, setLastSearchResult]);

  const handleSearch = useCallback(async () => {
    if (!canSearch || !activeLineString || !currentDataset?.datasetId) {
      notifyError('A kereséshez jelölj ki egy vonalat és válaszd ki a datasetet.');
      return;
    }
    setIsSearching(true);
    try {
      const endpoint = `${PATTERN_SERVICE_URL}/datasets/${currentDataset.datasetId}/search`;
      const payload = {
        linePoints: activeLineString.coordinates.map(([lng, lat]) => ({ x: lng, y: lat })),
        datasetFileIds: currentDataset.datasetFileId ? [currentDataset.datasetFileId] : undefined,
        patternName: currentDataset.datasetName ?? 'Map selection',
        generatePreviews: true,
      };
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await axios.post<PatternSearchRunResponse>(endpoint, payload, {
        headers,
      });
      setLastSearchResult(response.data);
      await queryClient.invalidateQueries({ queryKey: ['pattern-search-runs'] });
      notifySuccess('A keresés lefutott.');
    } catch (error: any) {
      const detail =
        (error?.response?.data?.detail as string | undefined) ?? 'Nem sikerült lefuttatni a keresést.';
      notifyError(detail, 'Mintakeresés hiba');
    } finally {
      setIsSearching(false);
    }
  }, [
    activeLineString,
    canSearch,
    currentDataset,
    queryClient,
    notifyError,
    notifySuccess,
    setLastSearchResult,
    token,
  ]);



  const PatternDetecting = () => {
    return (
      <div
        className={`${isOpened
          ? 'w-[400px] opacity-100 pointer-events-auto'
          : 'w-0 opacity-0 pointer-events-none'
          } bg-slate-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-slate-900 overflow-hidden`}
        style={{ height: 'calc(100vh - 58px)' }}
      >
        <div className="border-b border-slate-700 bg-slate-900/60 p-4">
          <h2 className="text-xl font-semibold text-white">Mintakeresés</h2>
          <p className="mt-1 text-xs text-slate-400">
            Rajzolj a térképen egy vonalat (LineString), majd futtasd a keresést az aktuális datasetre.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-sm text-slate-200">
          <div className="space-y-6">
            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Dataset</p>
              {currentDataset?.datasetId ? (
                <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
                  <div className="text-sm font-medium text-white">
                    {currentDataset.datasetName ?? 'Ismeretlen dataset'}
                  </div>
                  <div className="mt-1 text-xs text-slate-400 break-all">
                    <span className="font-semibold text-slate-300">ID:</span> {currentDataset.datasetId}
                  </div>
                  {currentDataset.datasetFileId ? (
                    <div className="mt-1 text-xs text-slate-400 break-all">
                      <span className="font-semibold text-slate-300">Fájlnév:</span>{' '}
                      {currentDataset.datasetFileName ?? currentDataset.datasetFileId}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-amber-400">
                      A megjelenített réteghez nem tartozik fájl azonosító.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
                  Válassz egy dataset fájlt a Map Viewer megnyitásakor.
                </div>
              )}
            </section>

            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Kijelölt vonal</p>
              {activeLineString ? (
                <div className="rounded border border-slate-700 bg-slate-900/60 p-3">
                  <div className="text-xs text-slate-300">
                    Pontok száma: <span className="font-semibold text-white">{linePointCount}</span>
                  </div>
                  {firstPoint ? (
                    <div className="mt-1 text-xs text-slate-400">
                      Kezdő pont:{' '}
                      <span className="text-slate-200">{firstPoint.map((v) => v.toFixed(6)).join(', ')}</span>
                    </div>
                  ) : null}
                  {lastPoint ? (
                    <div className="mt-1 text-xs text-slate-400">
                      Záró pont:{' '}
                      <span className="text-slate-200">{lastPoint.map((v) => v.toFixed(6)).join(', ')}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-400">
                  A kereséshez rajzolj legalább két pontból álló LineStringet a térképen.
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  icon="pi pi-search"
                  label="Keresés"
                  disabled={!canSearch || isSearching}
                  loading={isSearching}
                  onClick={handleSearch}
                />
                <Button
                  icon="pi pi-times"
                  label="Törlés"
                  severity="secondary"
                  outlined
                  disabled={!activeLineString}
                  onClick={handleClearLine}
                />
              </div>
              {!currentDataset?.datasetFileId && currentDataset?.datasetId ? (
                <p className="text-xs text-amber-400">
                  A kiválasztott réteg nem tartalmaz fájlt azonosítót, ezért a keresés nem indítható.
                </p>
              ) : null}
            </section>

            {isSearching ? (
              <div className="flex justify-center py-4">
                <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
              </div>
            ) : null}

            {lastSearchResult ? (
              <section className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Utolsó futás</p>
                  <div className="mt-1 text-xs text-slate-400">
                    Találat: <span className="text-slate-200">{lastSearchResult.successCount}</span> /{' '}
                    {lastSearchResult.totalFiles} fájl · {Math.round(lastSearchResult.durationMs)} ms
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {lastSearchResult.results.map((item) => {
                    const previewHref = buildPreviewUrl(item.previewUrl);
                    return (
                      <div
                        key={`${lastSearchResult.runId}-${item.datasetFileId}`}
                        className={`rounded border p-3 text-xs ${item.success ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/40'
                          }`}
                      >
                        <div className="font-medium text-slate-100">
                          {item.datasetFileName ?? item.datasetFileId}
                        </div>
                        <div className="mt-1 text-slate-300">
                          Score: {item.score.toFixed(3)} · {item.assetKind.toUpperCase()}
                        </div>
                        {item.message ? (
                          <div className="mt-1 text-slate-400">{item.message}</div>
                        ) : null}
                        {previewHref ? (
                          <div className="mt-2">
                            <a
                              href={previewHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:underline"
                            >
                              Előnézet megnyitása
                            </a>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

          </div>
        </div>
      </div>
    )
  }
  return (
    <div
      className={`${isOpened ? "w-[400px]" : "w-0"
        } bg-slate-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col border-r border-slate-900 overflow-hidden`}
      style={{ height: "calc(100vh - 58px)" }}
    >
      <div className="text-2xl font-medium p-4">Options</div>
      <TabView
        scrollable
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
        className="flex-1 overflow-hidden"
      >
        <TabPanel header="Patterns detecting">
         {PatternDetecting()}
        </TabPanel>
        <TabPanel header="Labeled features">
          {/*<div className="h-[80vh]">
                        <LabeledFeatures isActive={activeIndex === 1} />
                    </div>*/}
        </TabPanel>
        <TabPanel header="Similar researches">
          <div className="h-[80vh]">
            <SimilarResearch />
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};
