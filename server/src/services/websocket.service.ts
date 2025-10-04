import { Server as HTTPServer, IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { DatasetStatus } from "../domain/entities/Dataset";

type AuthenticatedSocket = {
  userId: string;
  socket: WebSocket;
};

export interface DatasetStatusMessage {
  type: "dataset:status";
  datasetId: string;
  status: DatasetStatus;
  fileId?: string;
  message?: string;
}

export type OutgoingRealtimeMessage = DatasetStatusMessage | Record<string, any>;

const userSockets = new Map<string, Set<WebSocket>>();
let wss: WebSocketServer | null = null;
let pingInterval: NodeJS.Timeout | null = null;

function registerSocket(userId: string, socket: WebSocket) {
  const bucket = userSockets.get(userId) ?? new Set<WebSocket>();
  bucket.add(socket);
  userSockets.set(userId, bucket);
}

function unregisterSocket(userId: string, socket: WebSocket) {
  const bucket = userSockets.get(userId);
  if (!bucket) return;
  bucket.delete(socket);
  if (!bucket.size) {
    userSockets.delete(userId);
  }
}

function authenticate(token: string) {
  const payload = jwt.verify(token, env.ADMIN_JWT_SECRET, {
    algorithms: ["HS384"],
  }) as any;
  const userId = payload?.id ?? payload?.userId;
  if (!userId) throw new Error("Token payload missing id");
  return { userId };
}

function setupHeartbeat(server: WebSocketServer) {
  pingInterval = setInterval(() => {
    server.clients.forEach((socket: WebSocket) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.ping();
        } catch (err) {
          logger.warn("WebSocket ping failed", { err });
        }
      }
    });
  }, 30000);
}

export function initWebsocket(server: HTTPServer) {
  if (wss) return wss;

  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: WebSocket, req: IncomingMessage) => {
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      const token = url.searchParams.get("token");
      if (!token) {
        socket.close(4401, "Token required");
        return;
      }
      const { userId } = authenticate(token);
      registerSocket(userId, socket);
      logger.debug("WebSocket client connected", { userId });

      socket.on("close", () => {
        unregisterSocket(userId, socket);
      });

      socket.on("error", (err: Error) => {
        logger.warn("WebSocket error", { err });
      });

      socket.on("message", (data: Buffer) => {
        if (data.toString() === "ping") {
          socket.send("pong");
        }
      });
    } catch (err) {
      logger.warn("WebSocket auth failed", { err });
      socket.close(4403, "Auth failed");
    }
  });

  setupHeartbeat(wss);
  logger.info("WebSocket server listening on /ws");
  return wss;
}

export function broadcastToUser(
  userId: string,
  message: OutgoingRealtimeMessage
) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(message);
  sockets.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  });
}

export function broadcast(message: OutgoingRealtimeMessage) {
  const payload = JSON.stringify(message);
  userSockets.forEach((sockets) => {
    sockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });
  });
}

export function sendDatasetStatusUpdate(userId: string, message: DatasetStatusMessage) {
  broadcastToUser(userId, message);
}

export function closeWebsocket() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (!wss) return;
  wss.clients.forEach((socket) => socket.close());
  wss.close();
  wss = null;
  userSockets.clear();
}
