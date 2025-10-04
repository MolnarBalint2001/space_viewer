import { MapContainer, TileLayer } from "react-leaflet";

const TILE_URL = "http://172.4.181.19:8080/data/heic2007b/{z}/{x}/{y}.png";

export const MapViewerPage = () => {
    return (
        <div className="h-full w-full" style={{ height: "100%" }}>
            <MapContainer
                
                center={[0.10437, 0.09613]}
                zoom={17}
                minZoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl
            >
                <TileLayer
                    maxNativeZoom={17}
                    maxZoom={23}

                    url={TILE_URL}
                    attribution="&copy; MapTiler Tiles"
                />
            </MapContainer>
        </div>
    );
};
