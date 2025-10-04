import { MapContainer, TileLayer, useMap} from "react-leaflet";
import { Button } from "primereact/button";
import { useMapSidebar } from "../../components/MapSidebarContext";
import L from 'leaflet';

import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { MapInitializer } from "./MapInitializer";

const TILE_URL = "http://172.4.181.19:8080/data/heic2007b/{z}/{x}/{y}.png";





export const MapViewerPage = () => {


    const {
        toggleOpened
    } = useMapSidebar();

   
    return (
        <div className="h-full w-full" style={{ height: "100%" }}>
            <Button
                icon={"pi pi-cog"}
                severity="secondary"
                text
                rounded
                className="absolute z-[1000] right-0 m-4" onClick={toggleOpened}></Button>
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
                <MapInitializer/>
            </MapContainer>
        </div>
    );
};
