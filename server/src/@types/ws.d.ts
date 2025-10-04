declare module "ws" {
  import { EventEmitter } from "events";
  import { Server as HTTPServer } from "http";
  import { Duplex } from "stream";

  type RawData = string | Buffer | ArrayBuffer | Buffer[];

  export class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;
    readyState: number;
    constructor(address: string, protocols?: string | string[], options?: any);
    send(data: RawData, cb?: (err?: Error) => void): void;
    close(code?: number, data?: string): void;
    ping(data?: RawData, cb?: (err?: Error) => void): void;
  }

  export interface ServerOptions {
    server?: HTTPServer;
    path?: string;
  }

  export class WebSocketServer extends EventEmitter {
    clients: Set<WebSocket>;
    constructor(options?: ServerOptions);
    on(event: "connection", listener: (socket: WebSocket, request: any) => void): this;
    on(event: "close", listener: () => void): this;
    close(cb?: () => void): void;
  }

  export { RawData };
}

