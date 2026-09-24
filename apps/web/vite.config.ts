import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Must match the --port used by `npm run dev` in apps/server.
const API_TARGET = "http://127.0.0.1:4321";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": API_TARGET,
      "/ws": { target: API_TARGET, ws: true },
    },
  },
});
