import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { Dropdown, type DropdownChangeEvent } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Tag } from "primereact/tag";
import { API_URL } from "../../config/globals";
import {
    DatasetDetail,
    DatasetFile,
    DatasetStatus,
    DatasetVisibility,
    DatasetsApi,
} from "../../config/api";
import { useApi } from "../../hooks/useApi";
import { useToast } from "../../components/ToastContext";
import { routes } from "../../config/routes";
import { EmbeddingServiceChecker } from "./EmbeddingServiceChecker";

const visibilityOptions = [
    { label: "Private", value: DatasetVisibility.Private },
    { label: "Shared via link", value: DatasetVisibility.Link },
    { label: "Public", value: DatasetVisibility.Public },
];

const statusConfig: Record<DatasetStatus, { label: string; severity: "success" | "info" | "danger" | "warning" | undefined }> = {
    [DatasetStatus.Empty]: { label: "No data", severity: "info" },
    [DatasetStatus.Uploading]: { label: "Uploading", severity: "warning" },
    [DatasetStatus.Processing]: { label: "Processing", severity: "warning" },
    [DatasetStatus.Ready]: { label: "Ready", severity: "success" },
    [DatasetStatus.Failed]: { label: "Error", severity: "danger" },
};

const apiBaseUrl = API_URL.replace(/\/?api$/, "");

const formatBytes = (value?: number | null) => {
    if (!value || Number.isNaN(value)) return "-";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let size = value;
    while (size >= 1024 && idx < units.length - 1) {
        size /= 1024;
        idx += 1;
    }
    const precision = size < 10 && idx > 0 ? 1 : 0;
    return `${size.toFixed(precision)} ${units[idx]}`;
};

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const DatasetManagerPage = () => {
    const datasetsApi = useApi(DatasetsApi);
    const { notifySuccess, notifyError, notifyInfo } = useToast();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({
        name: "",
        description: "",
        visibility: DatasetVisibility.Private as DatasetVisibility,
    });
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const tifInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);

    const datasetsQuery = useQuery({
        queryKey: ["datasets"],
        queryFn: async () => {
            const res = await datasetsApi.adminDatasetsGet();
            return res.data.items ?? [];
        },
    });

    const datasetDetailQuery = useQuery({
        queryKey: ["dataset", selectedDatasetId],
        queryFn: async () => {
            if (!selectedDatasetId) return null;
            const res = await datasetsApi.adminDatasetsDatasetIdGet(selectedDatasetId);
            return res.data ?? null;
        },
        enabled: Boolean(selectedDatasetId),
    });

    const datasetDetail = datasetDetailQuery.data ?? null;
    const datasets = (datasetsQuery.data ?? []).filter((item): item is NonNullable<typeof item> => Boolean(item));

    useEffect(() => {
        if (!selectedDatasetId && datasets.length) {
            setSelectedDatasetId(datasets[0].id ?? null);
        }
    }, [datasets, selectedDatasetId]);

    useEffect(() => {
        if (datasetDetail) {
            setEditName(datasetDetail.name ?? "");
            setEditDescription(datasetDetail.description ?? "");
        }
    }, [datasetDetail]);

    const createDatasetMutation = useMutation({
        mutationFn: async () => {
            const res = await datasetsApi.adminDatasetsPost(createForm);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (data?.id) {
                setSelectedDatasetId(data.id);
            }
            setCreateForm({
                name: "",
                description: "",
                visibility: DatasetVisibility.Private,
            });
            setIsCreateOpen(false);
            notifySuccess("New dataset created");
        },
        onError: () => notifyError("Failed to create dataset"),
    });

    const updateDatasetMutation = useMutation({
        mutationFn: async (payload: Partial<Pick<DatasetDetail, "name" | "description" | "visibility">>) => {
            if (!selectedDatasetId) return null;
            const res = await datasetsApi.adminDatasetsDatasetIdPatch(selectedDatasetId, payload);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (data?.id) {
                queryClient.invalidateQueries({ queryKey: ["dataset", data.id] });
            }
            notifySuccess("Dataset details updated");
        },
        onError: () => notifyError("Failed to update dataset"),
    });

    const uploadTifsMutation = useMutation({
        mutationFn: async (files: File[]) => {
            if (!selectedDatasetId) return null;
            const res = await datasetsApi.adminDatasetsDatasetIdFilesPost(selectedDatasetId, files);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (data?.id) {
                queryClient.invalidateQueries({ queryKey: ["dataset", data.id] });
            }
            if (tifInputRef.current) {
                tifInputRef.current.value = "";
            }
            notifyInfo("Processing started; tiles will be ready soon.");
        },
        onError: () => notifyError("Failed to upload TIF files"),
    });

    const uploadAttachmentsMutation = useMutation({
        mutationFn: async (files: File[]) => {
            if (!selectedDatasetId) return null;
            const res = await datasetsApi.adminDatasetsDatasetIdAttachmentsPost(selectedDatasetId, files);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (data?.id) {
                queryClient.invalidateQueries({ queryKey: ["dataset", data.id] });
            }
            if (attachmentInputRef.current) {
                attachmentInputRef.current.value = "";
            }
            notifySuccess("Attachments uploaded");
        },
        onError: () => notifyError("Failed to upload attachments"),
    });

    const shareMutation = useMutation({
        mutationFn: async () => {
            if (!selectedDatasetId) return null;
            const res = await datasetsApi.adminDatasetsDatasetIdSharePost(selectedDatasetId);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (selectedDatasetId) {
                queryClient.invalidateQueries({ queryKey: ["dataset", selectedDatasetId] });
            }
            notifySuccess("Share link created");
        },
        onError: () => notifyError("Failed to create share link"),
    });

    const revokeShareMutation = useMutation({
        mutationFn: async () => {
            if (!selectedDatasetId) return null;
            await datasetsApi.adminDatasetsDatasetIdShareDelete(selectedDatasetId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["datasets"] });
            if (selectedDatasetId) {
                queryClient.invalidateQueries({ queryKey: ["dataset", selectedDatasetId] });
            }
            notifySuccess("Share link revoked");
        },
        onError: () => notifyError("Failed to revoke share link"),
    });

    const isLoading = datasetsQuery.isLoading || datasetDetailQuery.isLoading;

    const shareLink = useMemo(() => {
        if (!datasetDetail?.shareToken) return null;
        return `${apiBaseUrl}/datasets/shared/${datasetDetail.shareToken}`;
    }, [datasetDetail?.shareToken]);

    const publicLink = useMemo(() => {
        if (!datasetDetail?.id || datasetDetail.visibility !== DatasetVisibility.Public) {
            return null;
        }
        return `${apiBaseUrl}/datasets/public/${datasetDetail.id}`;
    }, [datasetDetail?.id, datasetDetail?.visibility]);

    const handleVisibilityChange = (event: DropdownChangeEvent) => {
        const value = event.value as DatasetVisibility;
        updateDatasetMutation.mutate({ visibility: value });
    };

    const handleDatasetSave = () => {
        updateDatasetMutation.mutate({
            name: editName,
            description: editDescription,
        });
    };

    const handleUploadTifs = (files: FileList | null) => {
        if (!files?.length) return;
        uploadTifsMutation.mutate(Array.from(files));
    };

    const handleUploadAttachments = (files: FileList | null) => {
        if (!files?.length) return;
        uploadAttachmentsMutation.mutate(Array.from(files));
    };

    const handleDownload = async (type: "tif" | "mbtiles" | "attachment", id: string) => {
        if (!selectedDatasetId) return;
        try {
            let url: string | undefined;
            if (type === "tif") {
                const res = await datasetsApi.adminDatasetsDatasetIdFilesFileIdDownloadGet(
                    selectedDatasetId,
                    id
                );
                url = res.data.url;
            } else if (type === "mbtiles") {
                const res = await datasetsApi.adminDatasetsDatasetIdFilesFileIdMbtilesGet(
                    selectedDatasetId,
                    id
                );
                url = res.data.url;
            } else {
                const res = await datasetsApi.adminDatasetsDatasetIdAttachmentsAttachmentIdDownloadGet(
                    selectedDatasetId,
                    id
                );
                url = res.data.url;
            }
            if (url) {
                window.open(url, "_blank", "noopener");
            } else {
                notifyError("Download link unavailable");
            }
        } catch {
            notifyError("Failed to retrieve download link");
        }
    };

    const handleViewOnMap = (file: DatasetFile) => {
        if (!file.tilesetKey) {
            notifyError("No tile service available for this file");
            return;
        }
        const params = new URLSearchParams();
        params.set("tilesKey", file.tilesetKey);
        if (selectedDatasetId) {
            params.set("datasetId", selectedDatasetId);
        }
        if (file.id) {
            params.set("fileId", file.id);
        }
        if (file.centerLat != null && file.centerLng != null) {
            params.set("lat", String(file.centerLat));
            params.set("lng", String(file.centerLng));
        }
        if (datasetDetail?.name) {
            params.set("name", datasetDetail.name);
        } else if (file.originalFilename) {
            params.set("name", file.originalFilename);
        }
        if (file.originalFilename) {
            params.set("fileName", file.originalFilename);
        }
        navigate(`${routes.mapViewer}?${params.toString()}`);
    };

    const copyToClipboard = async (value: string | null) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
            notifySuccess("Link copied to clipboard");
        } catch {
            notifyError("Failed to copy link");
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Dataset manager</h1>
                    <p className="text-sm text-slate-400">
                        Upload TIF files, track processing status, and share your datasets.
                    </p>
                </div>
                <div className="flex items-center gap-8">
                    <EmbeddingServiceChecker />
                    <Button
                        label="New dataset"
                        icon="pi pi-plus"
                        onClick={() => setIsCreateOpen(true)}
                    />
                </div>

            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="bg-slate-900/60 border border-slate-800 lg:col-span-1" title="Datasets">
                    {datasetsQuery.isLoading ? (
                        <div className="flex justify-center py-6">
                            <ProgressSpinner strokeWidth="4" style={{ width: "40px", height: "40px" }} />
                        </div>
                    ) : datasets.length ? (
                        <div className="space-y-3">
                            {datasets.map((dataset) => {
                                const status = dataset.status ?? DatasetStatus.Empty;
                                const config = statusConfig[status];
                                const isActive = selectedDatasetId === dataset.id;
                                return (
                                    <button
                                        key={dataset.id}
                                        type="button"
                                        onClick={() => setSelectedDatasetId(dataset.id ?? null)}
                                        className={`w-full rounded-md border p-3 text-left transition ${isActive
                                                ? "border-sky-500/70 bg-sky-500/10"
                                                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-white">
                                                {dataset.name ?? "Untitled dataset"}
                                            </span>
                                            <Tag
                                                value={config.label}
                                                severity={config.severity}
                                            />
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">
                                            Last updated: {formatDate(dataset.updatedAt)}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            {dataset.fileCount ?? 0} TIF · {dataset.attachmentCount ?? 0} attachments
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">
                            No datasets yet. Click the "New dataset" button to get started.
                        </p>
                    )}
                </Card>

                <Card className="bg-slate-900/60 border border-slate-800 lg:col-span-2" title="Details">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <ProgressSpinner strokeWidth="4" style={{ width: "48px", height: "48px" }} />
                        </div>
                    ) : datasetDetail ? (
                        <div className="space-y-6">
                            <section className="space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            {datasetDetail.name ?? "Untitled dataset"}
                                        </h2>
                                        <p className="text-sm text-slate-400">
                                            {datasetDetail.description || "No description provided."}
                                        </p>
                                    </div>
                                    <Tag
                                        
                                        className="w-32"
                                        value={statusConfig[datasetDetail.status ?? DatasetStatus.Empty].label}
                                        severity={statusConfig[datasetDetail.status ?? DatasetStatus.Empty].severity}
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                                        Name
                                        <InputText
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Dataset name"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                                        Visibility
                                        <Dropdown
                                            value={datasetDetail.visibility ?? DatasetVisibility.Private}
                                            options={visibilityOptions}
                                            optionLabel="label"
                                            optionValue="value"
                                            onChange={handleVisibilityChange}
                                            loading={updateDatasetMutation.isPending}
                                        />
                                    </label>
                                </div>

                                <label className="flex flex-col gap-2 text-sm text-slate-200">
                                    Description
                                    <InputTextarea
                                        autoResize
                                        rows={3}
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Short description of the dataset"
                                    />
                                </label>

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        label="Save"
                                        icon="pi pi-save"
                                        onClick={handleDatasetSave}
                                        loading={updateDatasetMutation.isPending}
                                        disabled={updateDatasetMutation.isPending}
                                    />
                                    {datasetDetail.readyAt && (
                                        <span className="text-xs text-slate-400">
                                            Completed: {formatDate(datasetDetail.readyAt)}
                                        </span>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-white">TIF files</h3>
                                <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input
                                            ref={tifInputRef}
                                            type="file"
                                            multiple
                                            accept=".tif,.tiff,image/tiff"
                                            onChange={(event) => handleUploadTifs(event.target.files)}
                                            className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-700"
                                        />
                                        {uploadTifsMutation.isPending && (
                                            <span className="text-sm text-slate-400">
                                                Upload in progress...
                                            </span>
                                        )}
                                    </div>

                                    {datasetDetail.files?.length ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                                                <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">File name</th>
                                                        <th className="px-3 py-2 text-left">Size</th>
                                                        <th className="px-3 py-2 text-left">Resolution</th>
                                                        <th className="px-3 py-2 text-left">Status</th>
                                                        <th className="px-3 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {datasetDetail.files.map((file) => {
                                                        const status = file.status ?? DatasetStatus.Empty;
                                                        const config = statusConfig[status];
                                                        return (
                                                            <tr
                                                                key={file.id}
                                                                className="transition hover:bg-slate-900/80"
                                                            >
                                                                <td className="px-3 py-2 align-top">
                                                                    <div className="font-medium text-white">
                                                                        {file.originalFilename}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        Uploaded: {formatDate(file.createdAt)}
                                                                    </div>
                                                                    {file.processedAt && (
                                                                        <div className="text-xs text-slate-500">
                                                                            Ready: {formatDate(file.processedAt)}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 align-top text-slate-300">
                                                                    {formatBytes(file.size)}
                                                                </td>
                                                                <td className="px-3 py-2 align-top text-slate-300">
                                                                    {file.width && file.height
                                                                        ? `${file.width} × ${file.height}`
                                                                        : "-"}
                                                                </td>
                                                                <td className="px-3 py-2 align-top">
                                                                    <Tag value={config.label} severity={config.severity} />
                                                                    {file.errorMessage && (
                                                                        <div className="mt-1 text-xs text-red-400">
                                                                            {file.errorMessage}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 align-top">
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <Button
                                                                            label="Eredeti"
                                                                            icon="pi pi-download"
                                                                            outlined
                                                                            size="small"
                                                                            onClick={() =>
                                                                                file.id &&
                                                                                handleDownload("tif", file.id)
                                                                            }
                                                                        />
                                                                        <Button
                                                                            label="MBTiles"
                                                                            icon="pi pi-table"
                                                                            severity="success"
                                                                            size="small"
                                                                            disabled={!file.mbtilesDownloadUrl && status !== DatasetStatus.Ready}
                                                                            onClick={() =>
                                                                                file.id &&
                                                                                handleDownload("mbtiles", file.id)
                                                                            }
                                                                        />
                                                                        <Button
                                                                            label="View"
                                                                            icon="pi pi-map"
                                                                            severity="info"
                                                                            outlined
                                                                            size="small"
                                                                            disabled={!file.tilesetKey}
                                                                            onClick={() => handleViewOnMap(file)}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">
                                            You have not uploaded any TIF files for this dataset yet.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-white">Attachments</h3>
                                <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input
                                            ref={attachmentInputRef}
                                            type="file"
                                            multiple
                                            accept="application/pdf"
                                            onChange={(event) => handleUploadAttachments(event.target.files)}
                                            className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-700"
                                        />
                                        {uploadAttachmentsMutation.isPending && (
                                            <span className="text-sm text-slate-400">
                                                Upload in progress...
                                            </span>
                                        )}
                                    </div>
                                    {datasetDetail.attachments?.length ? (
                                        <ul className="space-y-2 text-sm text-slate-200">
                                            {datasetDetail.attachments.map((attachment) => (
                                                <li
                                                    key={attachment.id}
                                                    className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/50 px-3 py-2"
                                                >
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {attachment.originalFilename}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {formatBytes(attachment.size)} · uploaded {formatDate(attachment.createdAt)}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="small"
                                                        label="Download"
                                                        icon="pi pi-download"
                                                        outlined
                                                        onClick={() =>
                                                            attachment.id &&
                                                            handleDownload("attachment", attachment.id)
                                                        }
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400">
                                            No attachments uploaded.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h3 className="text-lg font-semibold text-white">Sharing</h3>
                                <div className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            label={shareLink ? "Refresh share link" : "Create share link"}
                                            icon="pi pi-share-alt"
                                            onClick={() => shareMutation.mutate()}
                                            loading={shareMutation.isPending}
                                        />
                                        {shareLink && (
                                            <Button
                                                label="Copy link"
                                                icon="pi pi-copy"
                                                outlined
                                                onClick={() => copyToClipboard(shareLink)}
                                            />
                                        )}
                                        {shareLink && (
                                            <Button
                                                label="Revoke sharing"
                                                icon="pi pi-times"
                                                severity="danger"
                                                onClick={() => revokeShareMutation.mutate()}
                                                loading={revokeShareMutation.isPending}
                                            />
                                        )}
                                    </div>
                                    {shareLink && (
                                        <div className="text-sm text-slate-300">
                                            <span className="text-slate-400">Share link:</span> {shareLink}
                                        </div>
                                    )}
                                    {publicLink && (
                                        <div className="text-sm text-emerald-300">
                                            Public view: {publicLink}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">
                            Select a dataset on the left to view details or create a new one.
                        </p>
                    )}
                </Card>
            </div>

            <Dialog
                header="Create new dataset"
                visible={isCreateOpen}
                onHide={() => setIsCreateOpen(false)}
                style={{ width: "min(480px, 90vw)" }}
            >
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                        Name
                        <InputText
                            value={createForm.name}
                            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Dataset name"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                        Description
                        <InputTextarea
                            autoResize
                            rows={3}
                            value={createForm.description}
                            onChange={(e) =>
                                setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Short description (optional)"
                        />
                    </label>

                    <label className="flex flex-col gap-2 text-sm text-slate-200">
                        Visibility
                        <Dropdown
                            value={createForm.visibility}
                            options={visibilityOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(event) =>
                                setCreateForm((prev) => ({
                                    ...prev,
                                    visibility: event.value as DatasetVisibility,
                                }))
                            }
                        />
                    </label>

                    <div className="flex justify-end gap-3">
                        <Button
                            label="Cancel"
                            severity="secondary"
                            onClick={() => setIsCreateOpen(false)}
                        />
                        <Button
                            label="Create"
                            icon="pi pi-check"
                            onClick={() => createDatasetMutation.mutate()}
                            loading={createDatasetMutation.isPending}
                            disabled={!createForm.name.trim()}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default DatasetManagerPage;
