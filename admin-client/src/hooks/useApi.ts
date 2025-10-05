import { useMemo } from "react";
import axios, { type AxiosInstance } from "axios";
import type { BaseAPI } from "../config/api/base";
import { useAuth } from "../components/AuthContext";
import { Configuration } from "../config/api";
import { API_URL } from "../config/globals";
// Generic constructor type
type ApiConstructor<T extends BaseAPI> = new (
    configuration?: Configuration,
    basePath?: string,
    axios?: AxiosInstance
) => T;

export function useApi<T extends BaseAPI>(apiClassRef: ApiConstructor<T>) {
    const { token, setToken } = useAuth();

    const api = useMemo(() => {
        // 1) Custom axios instance, baseURL from .env
        const axiosInstance = axios.create({
            baseURL: API_URL,
        });
        // 2) Attach Authorization header to outgoing requests
        axiosInstance.interceptors.request.use((config) => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // 3) Optional 401 handling
        axiosInstance.interceptors.response.use(
            (r) => r,
            async (error) => {
                if (error?.response?.status === 401) {
                    // e.g. attempt refresh or sign out the user
                    // await tryRefresh() || logout();
                    setToken(null)
                }
                return Promise.reject(error);
            }
        );


        // 4) Generated client using the custom axios instance
        const cfg = new Configuration({ basePath: API_URL });
        return new apiClassRef(cfg, undefined, axiosInstance);
    }, [token, setToken, apiClassRef]);



    return api;
}
