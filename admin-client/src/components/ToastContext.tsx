/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useRef } from "react";
import { Toast, type ToastMessage } from "primereact/toast";

type ToastContextType = {
    notify: (options: ToastMessage) => void;
    notifySuccess: (message: string, summary?: string) => void;
    notifyError: (message: string, summary?: string) => void;
};

const defaultContext: ToastContextType = {
    notify: () => {},
    notifySuccess: () => {},
    notifyError: () => {},
};

const ToastContext = createContext<ToastContextType>(defaultContext);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const toastRef = useRef<Toast>(null);

    const notify = (options: ToastMessage) => {
        toastRef.current?.show(options);
    };

    const notifySuccess = (message: string, summary = "Siker") => {
        notify({
            severity: "success",
            summary,
            detail: message,
            life: 3000,
        });
    };

    const notifyError = (message: string, summary = "Hiba") => {
        notify({
            severity: "error",
            summary,
            detail: message,
            life: 4000,
        });
    };

    return (
        <ToastContext.Provider value={{ notify, notifySuccess, notifyError }}>
            {/* Globális toast komponens */}
            <Toast ref={toastRef} />
            {children}
        </ToastContext.Provider>
    );
};
