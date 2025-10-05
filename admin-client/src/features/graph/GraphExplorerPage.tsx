import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "primereact/card";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Link } from "react-router-dom";
import { AttachmentGraphPanel } from "../mapViewer/AttachmentGraphPanel";
import { routes } from "../../config/routes";
import { useApi } from "../../hooks/useApi";
import { DatasetsApi, type DatasetSummary } from "../../config/api";

interface DatasetOption {
  label: string;
  value: string;
}

export const GraphExplorerPage = () => {
  const datasetsApi = useApi(DatasetsApi);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  const datasetsQuery = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const res = await datasetsApi.adminDatasetsGet();
      return (res.data.items ?? []).filter((item): item is DatasetSummary => Boolean(item?.id));
    },
  });

  const datasetOptions = useMemo<DatasetOption[]>(() => {
    return (datasetsQuery.data ?? []).map((dataset) => ({
      label: dataset.name ?? dataset.id ?? "Ismeretlen kutatás",
      value: dataset.id!,
    }));
  }, [datasetsQuery.data]);

  useEffect(() => {
    if (!selectedDatasetId && datasetOptions.length) {
      setSelectedDatasetId(datasetOptions[0].value);
    }
  }, [datasetOptions, selectedDatasetId]);

  const handleDatasetChange = (event: DropdownChangeEvent) => {
    const value = typeof event.value === "string" ? event.value : null;
    setSelectedDatasetId(value);
  };

  const selectedDataset = useMemo(() => {
    return datasetsQuery.data?.find((item) => item.id === selectedDatasetId) ?? null;
  }, [datasetsQuery.data, selectedDatasetId]);

  return (
    <div className="p-3 space-y-6">
      <Card className="bg-slate-900/50 border border-slate-800">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <span className="block text-xs uppercase tracking-wide text-slate-400">
                Kutatás kiválasztása
              </span>
              <Dropdown
                value={selectedDatasetId}
                onChange={handleDatasetChange}
                options={datasetOptions}
                placeholder={datasetsQuery.isLoading ? "Töltés..." : "Válassz kutatást"}
                className="w-full md:w-72"
                showClear
              />
            </div>
            {selectedDataset ? (
              <div className="text-xs text-slate-400">
                <div>
                  <span className="font-semibold text-slate-200">Állapot:</span> {selectedDataset.status}
                </div>
                <div>
                  <span className="font-semibold text-slate-200">Fájlok:</span> {selectedDataset.fileCount}
                  {" · "}
                  <span className="font-semibold text-slate-200">Mellékletek:</span> {selectedDataset.attachmentCount}
                </div>
              </div>
            ) : null}
          </div>

          {datasetsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <ProgressSpinner style={{ width: "20px", height: "20px" }} strokeWidth="4" />
              Kutatások betöltése...
            </div>
          ) : null}

          {datasetOptions.length === 0 && !datasetsQuery.isLoading ? (
            <div className="rounded border border-slate-700 bg-slate-900/60 p-1 text-sm text-slate-300">
              Nincs elérhető kutatás. Hozz létre egy újat a {" "}
              <Link className="text-sky-400 hover:underline" to={routes.datasets}>
                Datasetek
              </Link>{" "}
              lapon.
            </div>
          ) : (
            <AttachmentGraphPanel datasetId={selectedDatasetId} heightClass="h-[700px]" />
          )}
        </div>
      </Card>
    </div>
  );
};

export default GraphExplorerPage;
