import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { useMemo } from "react";
import { useMapSidebar } from "../../components/MapSidebarContext";
import { buildPreviewUrl } from "../../types/patternSearch";

interface MapSearchResultOverlayProps {
  activeDatasetFileId: string | null;
}

export const MapSearchResultOverlay = ({ activeDatasetFileId }: MapSearchResultOverlayProps) => {
  const { lastSearchResult } = useMapSidebar();

  const result = useMemo(() => {
    if (!lastSearchResult || !activeDatasetFileId) return null;
    return lastSearchResult.results.find(
      (item) => item.datasetFileId === activeDatasetFileId && item.success,
    );
  }, [lastSearchResult, activeDatasetFileId]);

  if (!result) {
    return null;
  }

  const previewUrl = buildPreviewUrl(result.previewUrl);

  return (
    <div className="absolute left-16 top-18 z-[900] max-w-sm">
      <Card title="Pattern search result" className="bg-slate-900/80 border border-slate-700 text-slate-100">
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-semibold">File</div>
            <div className="text-slate-300 break-all">{result.datasetFileName ?? result.datasetFileId}</div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span>Score: <span className="font-semibold text-emerald-400">{result.score.toFixed(3)}</span></span>
            <span>Source: {result.assetKind.toUpperCase()}</span>
          </div>
          {result.message ? (
            <div className="text-xs text-amber-400">{result.message}</div>
          ) : null}
          {previewUrl ? (
            <div className="space-y-2">
              <img
                src={previewUrl}
                alt="Pattern match preview"
                className="w-full rounded border border-slate-700"
              />
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Button icon="pi pi-external-link" label="Open preview" size="small" />
              </a>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
};
