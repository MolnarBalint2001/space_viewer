const resolvedApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
export const API_URL = resolvedApiUrl;
export const WS_URL = resolvedApiUrl.replace(/\/?api$/, "").replace(/^http/, "ws") + "/ws";
export const TILESERVER_URL = import.meta.env.VITE_TILESERVER_URL ?? "http://172.4.181.19:8080/data/";
