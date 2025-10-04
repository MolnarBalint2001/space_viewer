
import axios from "axios";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { useToast } from "../../components/ToastContext";
import { useSearchParams } from "react-router-dom";



type MapInitializerProps = {
    setPolygons:any
}

export const MapInitializer = ({setPolygons}:MapInitializerProps) => {

    const map = useMap();
    const {notifyError, notifySuccess} = useToast();

    const [searchParams] = useSearchParams();
    const tilesKey = searchParams.get("tilesKey");

    const [crePopVis, setCrePopVis] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [geom, setGeom] = useState<any | null>(null);
  
    const labelRef = useRef<HTMLInputElement>(null);
  
   
    const pendingLayerRef = useRef(null);

    //Actions
    const createPolygonEvent = (e: any) => {
        setCrePopVis(true);
        const layer:any = e.layer;
        pendingLayerRef.current = e.layer;
        const geojson = layer?.toGeoJSON();
        setGeom(geojson);
    }


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
            notifySuccess("Polygon successfully created.");
        }
        catch(error){
            notifyError("Something went wrong.", JSON.stringify(error));
        }
        finally{
            setIsSaving(false);
        }
    }, [geom, tilesKey]);

   

    

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

        map.addEventListener("pm:create", createPolygonEvent);

        return () => {
            map.removeEventListener('pm:create', createPolygonEvent);
          };
    
    }, [map]);

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