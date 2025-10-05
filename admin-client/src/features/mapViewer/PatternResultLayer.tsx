import { GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";
import { useMapSidebar } from "../../components/MapSidebarContext";

interface PatternResultLayerProps {
  activeDatasetFileId: string | null;
}

export const PatternResultLayer = ({ activeDatasetFileId }: PatternResultLayerProps) => {
  const { lastSearchResult } = useMapSidebar();

  const geojson = useMemo<FeatureCollection | null>(() => {
    if (!lastSearchResult || !activeDatasetFileId) return null;
    const item = lastSearchResult.results.find(
      (result) => result.datasetFileId === activeDatasetFileId && result.geojson && result.success,
    );
    if (item) {
      item!.geojson!.features = item?.geojson?.features.filter(x => x.properties?.kind == "pattern-line") as any

    }
    return (item?.geojson as FeatureCollection) ?? null;
  }, [lastSearchResult, activeDatasetFileId]);

  if (!geojson) {
    return null;
  }

  return (
    <GeoJSON
      data={geojson as any}
      style={(feature) => {
        const kind = feature?.properties?.kind;
        console.log(kind);
        if (kind === "pattern-polygon") {

        }
        return {
          color: "#30c71c",
          weight: 2,
          opacity: 1,
          fillRule: "nonzero",
          fillColor: "green",
        };
      }}
    />
  );
};
