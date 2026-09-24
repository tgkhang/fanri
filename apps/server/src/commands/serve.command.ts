import path from "node:path";
import open from "open";
import { createServerConfig } from "../config/server-config";
import { startServer } from "../server";

interface ServeOptions {
  port?: number;
  open: boolean;
  dev?: boolean;
}

/** `fanri [path]`: parse the folder, start the local server, open the browser (FR-1.1, FR-1.2). */
export async function serveCommand(root: string, options: ServeOptions): Promise<void> {
  const config = createServerConfig({ root: path.resolve(root), port: options.port, dev: options.dev ?? false });
  const { url } = await startServer(config);

  console.log(`fanri is looking at ${config.root}`);
  console.log(`open ${url}`);
  if (options.open && !config.dev) await open(url);
}
