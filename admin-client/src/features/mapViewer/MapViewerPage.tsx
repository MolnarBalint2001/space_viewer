import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { TILESERVER_URL } from "../../config/globals";
import { useMapSidebar } from "../../components/MapSidebarContext";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { MapInitializer } from "./MapInitializer";
import { MapSearchResultOverlay } from "./MapSearchResultOverlay";
import { PatternResultLayer } from "./PatternResultLayer";
import { Button } from "primereact/button";
import { SearchPanel } from "./SearchPanel";
import axios from "axios";

const DEFAULT_CENTER: [number, number] = [0.10437, 0.09613];
const DEFAULT_ZOOM = 17;
const DEFAULT_TILE_URL = `${TILESERVER_URL.replace(/\/$/, "")}/heic2007b/{z}/{x}/{y}.png`;

function buildTileUrl(tilesKey: string | null, tilesUrl: string | null): string {
  if (tilesUrl) return tilesUrl;
  if (tilesKey) {
    const base = TILESERVER_URL.replace(/\/$/, "");
    return `${base}/${tilesKey}/{z}/{x}/{y}.png`;
  }
  return DEFAULT_TILE_URL;
}

export const MapViewerPage = () => {
  const [polygons, setPolygons] = useState<any | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const tilesKey = searchParams.get("tilesKey");
  const tilesUrl = searchParams.get("tilesUrl");
  const datasetIdParam = searchParams.get("datasetId");

  const datasetName = searchParams.get("name");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const datasetFileId = searchParams.get("fileId");
  const datasetFileName = searchParams.get("fileName");

  const tileUrl = useMemo(() => buildTileUrl(tilesKey, tilesUrl), [tilesKey, tilesUrl]);

  const parsedCenter = useMemo(() => {
    const lat = latParam ? Number(latParam) : null;
    const lng = lngParam ? Number(lngParam) : null;
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng] as [number, number];
    }
    return DEFAULT_CENTER;
  }, [latParam, lngParam]);

  const { toggleOpened, setCurrentDataset, setActiveLineString, setLastSearchResult } = useMapSidebar();

  // Keep sidebar state in sync with URL params
  useEffect(() => {
    if (datasetIdParam) {
      setCurrentDataset({
        datasetId: datasetIdParam,
        datasetName: datasetName || undefined,
        datasetFileId: datasetFileId ?? undefined,
        datasetFileName: datasetFileName ?? undefined,
      });
    } else {
      setCurrentDataset(null);
    }
    setActiveLineString(null);
    setLastSearchResult(null);
  }, [datasetIdParam, datasetName, datasetFileId, datasetFileName, setCurrentDataset, setActiveLineString, setLastSearchResult]);

  const handlePolygonsLoaded = useCallback((featureCollection: any | null) => {
    setPolygons(featureCollection);
  }, []);

  // If nothing specified, load default dataset and push into the URL
  useEffect(() => {
    if (datasetIdParam || tilesKey || tilesUrl) return;

    let isActive = true;

    const loadDefaultDataset = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/datasets/getDefault");
        const data = response.data;
        if (!data || !isActive) return;

        const newParams: Record<string, string> = {};
        if (data.datasetId) newParams.datasetId = String(data.datasetId);
        if (data.tilesetKey) newParams.tilesKey = data.tilesetKey;
        if (data.name) newParams.name = data.name;
        if (data.centerLat != null) newParams.lat = data.centerLat.toString();
        if (data.centerLng != null) newParams.lng = data.centerLng.toString();

        if (Object.keys(newParams).length > 0) {
          setSearchParams(newParams, { replace: true });
        }
      } catch (error) {
        console.error("Hiba a default fetch-ben:", error);
      }
    };

    loadDefaultDataset();
    return () => {
      isActive = false;
    };
  }, [datasetIdParam, tilesKey, tilesUrl, setSearchParams]);

  // When datasetId is present but tilesKey missing, resolve tiles and center from backend
  useEffect(() => {
    if (!datasetIdParam || tilesKey) return;

    let isActive = true;

    const loadDatasetFromQuery = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/datasets/getDatasetFile/${datasetIdParam}`
        );
        const file = response.data?.file;
        if (!file || !isActive) return;

        const newParams: Record<string, string> = {
          datasetId: datasetIdParam,
        };

        if (datasetName) newParams.name = datasetName;
        if (file.tilesetKey) newParams.tilesKey = file.tilesetKey;
        if (file.centerLat != null) newParams.lat = file.centerLat.toString();
        if (file.centerLng != null) newParams.lng = file.centerLng.toString();

        setSearchParams(newParams, { replace: true });
      } catch (error) {
        console.error("Hiba a dataset fetch-ben datasetId alapján:", error);
      }
    };

    loadDatasetFromQuery();
    return () => {
      isActive = false;
    };
  }, [datasetIdParam, datasetName, tilesKey, setSearchParams]);

  // Load polygons for the current tilesKey
  useEffect(() => {
    if (!tilesKey) {
      setPolygons(null);
      return;
    }

    let isActive = true;

    const loadPolygons = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/polygon?tileKey=${encodeURIComponent(tilesKey)}`
        );
        const dbPolygons = response.data.polygons || [];

        const featureCollection = {
          type: "FeatureCollection" as const,
          features: dbPolygons.map((polygon: any) => ({
            type: "Feature" as const,
            properties: {
              id: polygon.id,
              label: polygon.label,
              creatorUserId: polygon.creatorUserId,
              creatorUserName: polygon.creatorUserName,
            },
            geometry: polygon.geom,
          })),
        };

        if (isActive) setPolygons(featureCollection);
      } catch (error) {
        console.error("Hiba a polygon fetch-ben:", error);
        if (isActive) setPolygons(null);
      }
    };

    loadPolygons();
    return () => {
      isActive = false;
    };
  }, [tilesKey]);

  const style = (feature?: any) => ({
    fillColor: feature?.properties?.label === "Teszt" ? "red" : "lightblue",
    weight: 4,
    opacity: 1,
    color: "lightgreen",
    fillOpacity: 0.5,
  });

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature?.properties;
    if (props?.label) {
      layer.bindPopup(
        `<b>${props.label}</b><br>ID: ${props.id}<br>Készítette: ${props.creatorUserName}`
      );
      layer.bindTooltip(props.label, { permanent: false, direction: "center" });
    }

    layer.on("click", () => {
      console.log("Kattintott polygon:", props?.id);
      // TODO: open edit dialog
    });
  };

  return (
    <div className="flex h-full w-full flex-col relative" style={{ height: "100%" }}>
      {/* Header bar with current layer and tile URL */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200">
        <span>{datasetName ? `Megjelenő réteg: ${datasetName}` : "Alapréteg"}</span>
        <code className="truncate text-xs text-slate-400">{tileUrl}</code>
      </div>

      <div className="flex-1 relative">
        <MapSearchResultOverlay activeDatasetFileId={datasetFileId} />

        {/* Top-right controls */}
        <div className="flex z-[10000000] absolute m-4 right-0 gap-2 w-[95%] justify-between">
          <SearchPanel onPolygonsLoaded={handlePolygonsLoaded} />
          <Button icon="pi pi-cog" severity="info" rounded onClick={toggleOpened} />
        </div>

        <MapContainer
          center={parsedCenter}
          zoom={DEFAULT_ZOOM}
          minZoom={0}
          style={{ height: "100%", width: "100%" }}
          zoomControl
        >
          <MapInitializer setPolygons={setPolygons} />

          {polygons && (
            <GeoJSON key={"asd" + polygons.features.length} data={polygons} style={style as any} onEachFeature={onEachFeature as any} />
          )}

          <TileLayer
            key={tileUrl}
            maxNativeZoom={17}
            maxZoom={23}
            url={tileUrl}
            attribution="&copy; MapTiler Tiles"
          />

          <PatternResultLayer activeDatasetFileId={datasetFileId} />
        </MapContainer>
      </div>
    </div>
  );
};
