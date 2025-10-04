import { useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { TILESERVER_URL } from "../../config/globals";
import { useMapSidebar } from "../../components/MapSidebarContext";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { MapInitializer } from "./MapInitializer";

const DEFAULT_CENTER: [number, number] = [0.10437, 0.09613];
const DEFAULT_ZOOM = 17;
const DEFAULT_TILE_URL = `${TILESERVER_URL.replace(/\/$/, "")}/heic2007b/{z}/{x}/{y}.png`;

function buildTileUrl(tilesKey: string | null, tilesUrl: string | null): string {
    if (tilesUrl) {
        return tilesUrl;
    }
    if (tilesKey) {
        const base = TILESERVER_URL.replace(/\/$/, "");
        return `${base}/${tilesKey}/{z}/{x}/{y}.png`;
    }
    return DEFAULT_TILE_URL;
}





export const MapViewerPage = () => {
    const [searchParams] = useSearchParams();
    const tilesKey = searchParams.get("tilesKey");
    const tilesUrl = searchParams.get("tilesUrl");
    const datasetName = searchParams.get("name");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const tileUrl = useMemo(() => buildTileUrl(tilesKey, tilesUrl), [tilesKey, tilesUrl]);
    const parsedCenter = useMemo(() => {
        const lat = latParam ? Number(latParam) : null;
        const lng = lngParam ? Number(lngParam) : null;
        if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
            return [lat, lng] as [number, number];
        }
        return DEFAULT_CENTER;
    }, [latParam, lngParam]);

    const {
        toggleOpened
    } = useMapSidebar();


    return (
        <div className="flex h-full w-full flex-col" style={{ height: "100%" }}>
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200">
                <span>
                    {datasetName ? `Megjelenő réteg: ${datasetName}` : "Alapréteg"}
                </span>
                <code className="truncate text-xs text-slate-400">{tileUrl}</code>
            </div>
            <div className="flex-1">

                <MapContainer
                    key={`${tileUrl}-${parsedCenter[0]}-${parsedCenter[1]}`}
                    center={parsedCenter}
                    zoom={DEFAULT_ZOOM}
                    minZoom={0}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl
                >
                    <MapInitializer />

                    <TileLayer
                        key={tileUrl}
                        maxNativeZoom={17}
                        maxZoom={23}
                        url={tileUrl}
                        attribution="&copy; MapTiler Tiles"
                    />
                </MapContainer>
            </div>
        </div>


    );


};
