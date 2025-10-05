import axios from "axios";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import { useToast } from "../../components/ToastContext";
import { useMapSidebar } from "../../components/MapSidebarContext";
import type { LineString } from "geojson";

export const MapInitializer = () => {

    const map = useMap();
    const {notifyError, notifySuccess} = useToast();
    const { setActiveLineString, activeLineString } = useMapSidebar();

    const [crePopVis, setCrePopVis] = useState<boolean>(false);
    const labelRef = useRef<HTMLInputElement>(null);
    const [geom, setGeom] = useState<any | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const pendingLayerRef = useRef<Layer | null>(null);
    const lineLayerRef = useRef<Layer | null>(null);

    //Actions
    const handleGeometryCreate = useCallback((e: any) => {
        const layer: any = e.layer;
        const geojson = layer?.toGeoJSON?.();
        if (!geojson || !geojson.geometry) {
            return;
        }

        if (geojson.geometry.type === "LineString") {
            if (lineLayerRef.current) {
                map.removeLayer(lineLayerRef.current);
            }
            lineLayerRef.current = layer;
            if (typeof layer.setStyle === "function") {
                layer.setStyle({ color: "#38bdf8", weight: 4 });
            }
            setActiveLineString(geojson.geometry as LineString);
            return;
        }

        setCrePopVis(true);
        pendingLayerRef.current = layer;
        setGeom(geojson);
    }, [map, setActiveLineString]);


    const createPolygon = useCallback(async() => {

        if (!geom) return;
        
        setIsSaving(true)

        const label = labelRef.current?.value;
        const data = {
            geom,
            label
        }
        try{
            const response = await axios.post("http://localhost:3000/api/polygon", data);
            console.log(response);
            if (pendingLayerRef.current) {
                (pendingLayerRef.current as any).remove();
                pendingLayerRef.current = null;
              }
              setCrePopVis(false);
              if (labelRef.current) labelRef.current.value = '';
            notifySuccess("Polygon successfully created.");
        }
        catch(error){
            notifyError("Something went wrong.", JSON.stringify(error));
        }
        finally{
            setIsSaving(false);
        }
    }, [geom]);

    useEffect(() => {
        if (!map.pm) return;

        map.pm.addControls({
            position: 'topleft',
            drawMarker: true,
            drawCircleMarker: false,
            drawPolyline: true,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: true,
            drawText: true,
            editMode: true,
            dragMode: true,
            cutPolygon: true,
            removalMode: true,
        });

        map.addEventListener("pm:create", handleGeometryCreate);

        return () => {
            map.removeEventListener('pm:create', handleGeometryCreate);
          };
    
    }, [map, handleGeometryCreate]);

    useEffect(() => {
        if (!activeLineString && lineLayerRef.current) {
            map.removeLayer(lineLayerRef.current);
            lineLayerRef.current = null;
        }
    }, [activeLineString, map]);

    const onDialogHide = () => {
        console.log(pendingLayerRef);
        if (pendingLayerRef.current) {
          (pendingLayerRef.current as any).remove();
          pendingLayerRef.current = null;
        }
        setCrePopVis(false);
        if (labelRef.current) labelRef.current.value = '';
      };


    return <>
        <Dialog header="Create observation" visible={crePopVis} className="w-[400px]" onHide={onDialogHide}>
            <div className="flex flex-col gap-4">
                <InputText ref={labelRef} placeholder="Label"></InputText>
                <Button
                    severity="success"
                    icon="pi pi-plus"
                    label="Create"
                    onClick={createPolygon}
                    loading={isSaving}
                ></Button>
            </div>
        </Dialog>


    </>;
}
