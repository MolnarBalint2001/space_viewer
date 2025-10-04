import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { TILESERVER_URL } from "../../config/globals";
import { useMapSidebar } from "../../components/MapSidebarContext";

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { MapInitializer } from "./MapInitializer";
import { Button } from "primereact/button";
import { SearchPanel } from "./SearchPanel";
import axios from "axios";

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
    const [polygons, setPolygons] = useState<any>(null);  // JAVÍTVA: null kezdetben, GeoJSON objektum lesz

    const [searchParams, setSearchParams] = useSearchParams();
    const tilesKey = searchParams.get("tilesKey");
    const tilesUrl = searchParams.get("tilesUrl");
    const datasetIdParam = searchParams.get("datasetId");

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

    const handlePolygonsLoaded = useCallback((featureCollection: any | null) => {
        setPolygons(featureCollection);
    }, [setPolygons]);

    useEffect(() => {
        if (datasetIdParam || tilesKey || tilesUrl) {
            return;
        }

        let isActive = true;

        const loadDefaultDataset = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/datasets/getDefault");
                const data = response.data;

                if (!data || !isActive) {
                    return;
                }

                const newParams: Record<string, string> = {};

                if (data.datasetId) {
                    newParams.datasetId = String(data.datasetId);
                }
                if (data.tilesetKey) {
                    newParams.tilesKey = data.tilesetKey;
                }
                if (data.name) {
                    newParams.name = data.name;
                }
                if (data.centerLat != null) {
                    newParams.lat = data.centerLat.toString();
                }
                if (data.centerLng != null) {
                    newParams.lng = data.centerLng.toString();
                }

                if (Object.keys(newParams).length > 0) {
                    setSearchParams(newParams, { replace: true });
                }
            } catch (error) {
                console.error('Hiba a default fetch-ben:', error);
            }
        };

        loadDefaultDataset();

        return () => {
            isActive = false;
        };
    }, [datasetIdParam, tilesKey, tilesUrl, setSearchParams]);

    useEffect(() => {
        if (!datasetIdParam || tilesKey) {
            return;
        }

        let isActive = true;

        const loadDatasetFromQuery = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:3000/api/datasets/getDatasetFile/" + datasetIdParam
                );
                const file = response.data?.file;

                if (!file || !isActive) {
                    return;
                }

                const newParams: Record<string, string> = {
                    datasetId: datasetIdParam,
                };

                if (datasetName) {
                    newParams.name = datasetName;
                }
                if (file.tilesetKey) {
                    newParams.tilesKey = file.tilesetKey;
                }
                if (file.centerLat != null) {
                    newParams.lat = file.centerLat.toString();
                }
                if (file.centerLng != null) {
                    newParams.lng = file.centerLng.toString();
                }

                setSearchParams(newParams, { replace: true });
            } catch (error) {
                console.error('Hiba a dataset fetch-ben datasetId alapj�n:', error);
            }
        };

        loadDatasetFromQuery();

        return () => {
            isActive = false;
        };
    }, [datasetIdParam, datasetName, tilesKey, setSearchParams]);
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
                const dbPolygons = response.data.polygons;

                const featureCollection = {
                    type: 'FeatureCollection' as const,
                    features: dbPolygons.map((polygon: any) => ({
                        type: 'Feature' as const,
                        properties: {
                            id: polygon.id,
                            label: polygon.label,
                            creatorUserId: polygon.creatorUserId,
                            creatorUserName: polygon.creatorUserName,
                        },
                        geometry: polygon.geom,
                    })),
                };

                if (isActive) {
                    setPolygons(featureCollection);
                }
            } catch (error) {
                console.error('Hiba a polygon fetch-ben:', error);
                if (isActive) {
                    setPolygons(null);
                }
            }
        };

        loadPolygons();

        return () => {
            isActive = false;
        };
    }, [tilesKey, setPolygons]);
    const style = (feature?: any) => ({
        fillColor: feature?.properties?.label === 'Teszt' ? 'red' : 'lightblue',  // Pl. label alapján
        weight: 4,
        opacity: 1,
        color: 'lightgreen',
        fillOpacity: 0.5,
    });

    // ÚJ: Eseménykezelő minden feature-re (popup, tooltip)
    const onEachFeature = (feature: any, layer: any) => {
        const props = feature?.properties;
        if (props?.label) {
            // Popup
            layer.bindPopup(
                `<b>${props.label}</b><br>ID: ${props.id}<br>Készítette: ${props.creatorUserName}`
            );
            // Tooltip
            layer.bindTooltip(props.label, { permanent: false, direction: 'center' });
        }

        // Kattintás esemény (pl. log vagy edit)
        layer.on('click', () => {
            console.log('Kattintott polygon:', props?.id);
            // Pl. nyisd meg egy Dialog-ot szerkesztésre
        });
    };


    return (
        <div className="flex h-full w-full flex-col relative" style={{ height: "100%" }}>
            <div className="flex-1">
                <div className="flex z-[10000000] absolute m-4 right-0 gap-2 w-[95%] justify-between">
                    <SearchPanel onPolygonsLoaded={handlePolygonsLoaded} />
                    <Button
                        icon={"pi pi-cog"}
                        severity="secondary"
                        text
                        rounded
                        onClick={toggleOpened}></Button>
                </div>
                <MapContainer
                    key={`${tileUrl}-${parsedCenter[0]}-${parsedCenter[1]}`}
                    center={parsedCenter}
                    zoom={DEFAULT_ZOOM}
                    minZoom={0}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl
                >
                    <MapInitializer setPolygons={setPolygons} />

                    {/* JAVÍTVA: GeoJSON – most már helyes data-val */}
                    {polygons && (
                        <GeoJSON
                            data={polygons}      // FeatureCollection
                            style={style}        // Stílusok
                            onEachFeature={onEachFeature}  // Popup-ok, események
                        />
                    )}

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












