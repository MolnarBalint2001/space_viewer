/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // place additional variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
