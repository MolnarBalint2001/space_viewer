declare module "neovis.js" {
  import type { Network } from "vis-network/standalone";

  export interface NeovisConfig {
    container_id: string;
    server_url?: string;
    server_user?: string;
    server_password?: string;
    labels?: Record<string, unknown>;
    relationships?: Record<string, unknown>;
    visConfig?: Record<string, unknown>;
    initial_cypher?: string;
  }

  export default class NeoVis {
    constructor(config: NeovisConfig);
    render(): void;
    clearNetwork(): void;
    readonly network?: Network;
    [key: string]: any;
  }
}
