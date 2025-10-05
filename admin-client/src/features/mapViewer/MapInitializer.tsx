
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
import { useSearchParams } from "react-router-dom";



type MapInitializerProps = {
    setPolygons:any
}

export const MapInitializer = ({setPolygons}:MapInitializerProps) => {

    const map = useMap();
    const {notifyError, notifySuccess} = useToast();
    const { setActiveLineString, activeLineString, triggerLabeledFeaturesReload } = useMapSidebar();

    const [searchParams] = useSearchParams();
    const tilesKey = searchParams.get("tilesKey");

    const [crePopVis, setCrePopVis] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const pendingLayerRef = useRef<Layer | null>(null);
    const lineLayerRef = useRef<Layer | null>(null);
    const [geom, setGeom] = useState<any | null>(null);
  
    const labelRef = useRef<HTMLInputElement>(null);
  
   

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
            label,
            tilesKey
        }
        try{
            const response = await axios.post("http://localhost:3000/api/polygon", data);
            if (pendingLayerRef.current) {
                (pendingLayerRef.current as any).remove();
                pendingLayerRef.current = null;
              }
              setCrePopVis(false);
              if (labelRef.current) labelRef.current.value = '';

              const response2 = await axios.get(`http://localhost:3000/api/polygon?tileKey=${tilesKey}`);
              const dbPolygons = response2.data.polygons;  // Array: [{ id, label, geom, ... }]
              console.log('DB polygonok:', dbPolygons);
  
              // Átalakítás GeoJSON FeatureCollection-re
              const featureCollection = {
                  type: 'FeatureCollection' as const,
                  features: dbPolygons.map((polygon: any) => ({
                      type: 'Feature' as const,
                      properties: {
                          id: polygon.id,
                          label: polygon.label,
                          creatorUserId: polygon.creatorUserId,
                          creatorUserName: polygon.creatorUserName,
                          // További properties, ha kell
                      },
                      geometry: polygon.geom,  // Közvetlenül a DB geom (Polygon GeoJSON)
                  })),
              };
  
              console.log('FeatureCollection:', featureCollection);
              setPolygons(featureCollection);  // State: Teljes GeoJSON objektum
              triggerLabeledFeaturesReload();
            notifySuccess("Polygon successfully created.");
        }
        catch(error){
            notifyError("Something went wrong.", JSON.stringify(error));
        }
        finally{
            setIsSaving(false);
        }
    }, [geom, tilesKey, triggerLabeledFeaturesReload]);

   

    

    useEffect(() => {
        if (!map.pm) return;

        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawCircleMarker: false,
            drawPolyline: true,
            drawRectangle: true,
            drawPolygon: true,
            drawCircle: false,
            drawText: false,
            editMode: false,
            dragMode: false,
            cutPolygon: false,
            removalMode: true,
            rotateMode:false
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
