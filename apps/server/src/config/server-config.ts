import { randomBytes } from "node:crypto";

export interface ServerConfig {
  root: string;
  /** Always 127.0.0.1, never 0.0.0.0 (NFR-2). */
  host: "127.0.0.1";
  /** 0 = let the OS pick a free port. */
  port: number;
  /** Random per-session token the UI must send (NFR-2). */
  token: string;
  dev: boolean;
}

export const DEV_WEB_PORT = 5173;

export function createServerConfig(input: { root: string; port?: number; dev: boolean }): ServerConfig {
  return {
    root: input.root,
    host: "127.0.0.1",
    port: input.port ?? 0,
    // Fixed in dev so the open tab keeps working across `node --watch` restarts.
    token: input.dev ? "dev" : randomBytes(16).toString("hex"),
    dev: input.dev,
  };
}
