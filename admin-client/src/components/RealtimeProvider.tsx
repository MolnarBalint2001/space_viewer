import type { PropsWithChildren, ReactElement } from "react";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL } from "../config/globals";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import type { DatasetDetail } from "../config/api";
import { DatasetStatus } from "../config/api";

type DatasetStatusMessage = {
    type: "dataset:status";
    datasetId: string;
    status: DatasetStatus;
    fileId?: string;
    message?: string;
};

type AttachmentTaggingMessage = {
    type: "attachment:tagging";
    datasetId: string;
    attachmentId: string;
    status: "processing" | "completed" | "failed";
    filename?: string;
    tags?: string[];
    error?: string;
};

type RealtimeMessage = DatasetStatusMessage | AttachmentTaggingMessage | Record<string, unknown>;

export const RealtimeProvider = ({ children }: PropsWithChildren): ReactElement => {
    const { token } = useAuth();
    const { notifySuccess, notifyError, notifyInfo } = useToast();
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token) {
            socketRef.current?.close();
            socketRef.current = null;
            return;
        }

        const socket = new WebSocket(`${WS_URL}?token=${token}`);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            try {
                const message: RealtimeMessage = JSON.parse(event.data ?? "{}");
                if (message?.type === "dataset:status") {
                    handleDatasetStatus(message as DatasetStatusMessage);
                } else if (message?.type === "attachment:tagging") {
                    handleAttachmentTagging(message as AttachmentTaggingMessage);
                }
            } catch (err) {
                console.warn("Realtime message parse error", err);
            }
        };

        socket.onclose = () => {
            socketRef.current = null;
        };

        return () => {
            socket.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const handleDatasetStatus = (payload: DatasetStatusMessage) => {
        const { datasetId, status, message } = payload;
        queryClient.invalidateQueries({ queryKey: ["datasets"] });
        if (datasetId) {
            queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
        }

        const cachedDetail = datasetId
            ? queryClient.getQueryData<DatasetDetail>(["dataset", datasetId])
            : undefined;
        const name = cachedDetail?.name ?? datasetId;

        if (status === DatasetStatus.Ready) {
            notifySuccess(
                "Processing complete",
                `Tiles for the ${name} dataset are ready.`
            );
        } else if (status === DatasetStatus.Failed) {
            notifyError(
                "Processing failed",
                message ?? `An error occurred while processing ${name}.`
            );
        } else if (status === DatasetStatus.Processing) {
            notifyInfo(
                "Processing started",
                `Generating tiles for the ${name} dataset.`
            );
        }
    };

    const handleAttachmentTagging = (payload: AttachmentTaggingMessage) => {
        const { datasetId, attachmentId, status, filename, tags, error } = payload;
        if (datasetId) {
            queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
        }
        queryClient.invalidateQueries({ queryKey: ["graph"] });

        const attachmentLabel = filename ?? attachmentId;
        if (status === "processing") {
            notifyInfo(
                "Tagging in progress",
                `Started tagging attachment ${attachmentLabel}.`
            );
        } else if (status === "completed") {
            notifySuccess(
                "Tagging completed",
                tags?.length
                    ? `${attachmentLabel}: ${tags.slice(0, 5).join(', ')}`
                    : `Tags are ready for attachment ${attachmentLabel}.`
            );
        } else if (status === "failed") {
            notifyError(
                "Tagging failed",
                error ?? `Failed to process attachment ${attachmentLabel}.`
            );
        }
    };

    return <>{children}</>;
};
