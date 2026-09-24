import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { errorHandler } from "./common/middleware/error-handler";
import { hostCheck } from "./common/middleware/host-check";
import { tokenAuth } from "./common/middleware/token-auth";
import type { ServerConfig } from "./config/server-config";
import { createGraphRouter } from "./features/graph";
import { healthRouter } from "./features/health";

export function createApp(config: ServerConfig): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(hostCheck);

  // ── API: one router per feature module ──
  const api = express.Router();
  api.use(tokenAuth(config.token));
  api.use("/health", healthRouter);
  api.use("/graph", createGraphRouter(config));
  app.use("/api", api);

  // ── Built SPA (only present after `npm run build`) ──
  const publicDir = path.join(import.meta.dirname, "public");
  if (existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get("/{*path}", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
  }

  app.use(errorHandler);
  return app;
}
