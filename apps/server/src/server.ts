import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { DEV_WEB_PORT, type ServerConfig } from "./config/server-config";
import { attachWatchGateway } from "./features/watch";

export async function startServer(config: ServerConfig): Promise<{ url: string }> {
  const httpServer = createServer(createApp(config));
  attachWatchGateway(httpServer, config);

  await new Promise<void>((resolve) => httpServer.listen(config.port, config.host, resolve));
  const { port } = httpServer.address() as AddressInfo;

  const uiPort = config.dev ? DEV_WEB_PORT : port;
  return { url: `http://${config.host}:${uiPort}/?t=${config.token}` };
}
