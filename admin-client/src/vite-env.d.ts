/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // ide jöhetnek további változók
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
