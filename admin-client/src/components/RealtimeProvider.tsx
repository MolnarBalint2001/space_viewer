import { PropsWithChildren, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL } from "../config/globals";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { DatasetStatus, DatasetDetail } from "../config/api";

type DatasetStatusMessage = {
    type: "dataset:status";
    datasetId: string;
    status: DatasetStatus;
    fileId?: string;
    message?: string;
};

type RealtimeMessage = DatasetStatusMessage | Record<string, unknown>;

export const RealtimeProvider = ({ children }: PropsWithChildren): JSX.Element => {
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
                "Feldolgozás kész",
                `A(z) ${name} kutatás csempéi elkészültek.`
            );
        } else if (status === DatasetStatus.Failed) {
            notifyError(
                "Feldolgozás sikertelen",
                message ?? `Hiba történt a(z) ${name} feldolgozása közben.`
            );
        } else if (status === DatasetStatus.Processing) {
            notifyInfo(
                "Feldolgozás elindult",
                `A(z) ${name} kutatás csempéinek generálása folyamatban.`
            );
        }
    };

    return <>{children}</>;
};
