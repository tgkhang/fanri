import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import type { ServerConfig } from "../../config/server-config";

export type WatchEvent = { type: "hello" } | { type: "graph-changed" };

/**
 * WebSocket channel for live updates (FR-1.4, P3). The client connects to /ws?t=<token>.
 * File watching (chokidar) plugs in here later and calls `broadcast({ type: "graph-changed" })`.
 */
export function attachWatchGateway(httpServer: Server, config: ServerConfig) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/ws" || url.searchParams.get("t") !== config.token) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.send(JSON.stringify({ type: "hello" } satisfies WatchEvent));
    });
  });

  return {
    broadcast(event: WatchEvent) {
      const data = JSON.stringify(event);
      for (const client of wss.clients) client.send(data);
    },
  };
}
