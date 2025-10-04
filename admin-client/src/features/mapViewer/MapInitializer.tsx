
import axios from "axios";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useEffect, useRef, useState, useCallback } from "react";
import { useMap } from "react-leaflet";
import { useToast } from "../../components/ToastContext";

export const MapInitializer = () => {

    const map = useMap();
    const {notifyError, notifySuccess} = useToast();

    const [crePopVis, setCrePopVis] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [geom, setGeom] = useState<any | null>(null);
    const [polygons, setPolygons] = useState<any[]>([])
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