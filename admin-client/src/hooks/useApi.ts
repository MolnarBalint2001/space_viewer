import { useMemo } from "react";
import axios, { type AxiosInstance } from "axios";
import type { BaseAPI } from "../config/api/base";
import { useAuth } from "../components/AuthContext";
import { Configuration } from "../config/api";
import { API_URL } from "../config/globals";
// Generikus konstruktor típus
type ApiConstructor<T extends BaseAPI> = new (
    configuration?: Configuration,
    basePath?: string,
    axios?: AxiosInstance
) => T;

export function useApi<T extends BaseAPI>(apiClassRef: ApiConstructor<T>) {
    const { token, setToken } = useAuth();

    const api = useMemo(() => {
        // 1) Saját axios példány, baseURL az .env-ből
        const axiosInstance = axios.create({
            baseURL: API_URL,
        });
        // 2) Kimenő kérések: Authorization fejléc beállítása
        axiosInstance.interceptors.request.use((config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // 3) 401 kezelés (opcionális)
        axiosInstance.interceptors.response.use(
            (r) => r,
            async (error) => {
                if (error?.response?.status === 401) {
                    // pl. refresh próbálkozás vagy kiléptetés
                    // await tryRefresh() || logout();
                    setToken(null)
                }
                return Promise.reject(error);
            }
        );


        // 4) Generált kliens a saját axiosszal
        const cfg = new Configuration({ basePath: API_URL });
        return new apiClassRef(cfg, undefined, axiosInstance);
    }, [token, setToken, apiClassRef]);



    return api;
}
