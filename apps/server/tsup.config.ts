import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  // Workspace packages ship TS source, so bundle them into the CLI.
  noExternal: [/^@fanri\//],
  banner: { js: "#!/usr/bin/env node" },
});
