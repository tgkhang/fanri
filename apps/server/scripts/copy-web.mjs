// Copies the built SPA (apps/web/dist) into dist/public so the CLI can serve it.
import { cpSync, existsSync } from "node:fs";
import path from "node:path";

const here = import.meta.dirname;
const from = path.resolve(here, "../../web/dist");
const to = path.resolve(here, "../dist/public");

if (!existsSync(from)) {
  console.error(`web build not found at ${from}. Run "npm run build" from the repo root.`);
  process.exit(1);
}
cpSync(from, to, { recursive: true });
console.log(`copied web build -> ${to}`);
