# How to run fanri (development)

Everything you need to install, run, build and extend the project. For branch, commit and PR rules, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 1. Prerequisites

| Tool | Version | Check |
| --- | --- | --- |
| Node.js | **≥ 22** (repo uses 24, see `.nvmrc`) | `node -v` |
| npm | **≥ 11** (comes with Node 24) | `npm -v` |
| Git | any recent | `git --version` |
| Terraform CLI | optional: only for `terraform fmt` on samples and, later, provider schemas | `terraform version` |

VS Code will suggest the recommended extensions (Biome, Tailwind, Terraform) from `.vscode/extensions.json`.

> This repo uses **npm workspaces**. Don't use pnpm or yarn, or you'll get a second lock file.

---

## 2. First-time setup

```bash
git clone <repo-url> fanri
cd fanri
npm install
```

If npm prints `install-scripts ... esbuild`, approve it once. esbuild is the compiler used by Vite, tsx and tsup:

```bash
npm install-scripts approve esbuild
npm rebuild esbuild
```

Check that everything is green:

```bash
npm run check        # biome lint + typecheck (all packages) + unit tests
```

---

## 3. Run in development

```bash
npm run dev
```

Turbo starts two processes:

| Process | URL | What it is |
| --- | --- | --- |
| `fanri` (BE) | `http://127.0.0.1:4321` | Express API + WebSocket. Restarts on file change (`node --watch`) |
| `@fanri/web` (FE) | `http://127.0.0.1:5173` | Vite dev server with hot reload. Proxies `/api` and `/ws` to :4321 |

Open **<http://127.0.0.1:5173/?t=dev>**. The server prints this URL too. In dev mode the token is always `dev`.

By default the dev server reads `fixtures/aws-basic`. To point it at another folder, change the path in the `dev` script of `apps/server/package.json`, or run the BE on its own:

```bash
# terminal 1: BE against any Terraform folder
cd apps/server
node --watch --import tsx src/main.ts ../../samples/landing-zone/envs/prod --port 4321 --dev

# terminal 2: FE
npm run dev -w apps/web
```

Quick API check (token header required):

```bash
curl -H "x-fanri-token: dev" http://127.0.0.1:4321/api/health
curl -H "x-fanri-token: dev" http://127.0.0.1:4321/api/graph
```

---

## 4. Build and run like a user

```bash
npm run build                               # builds web, then bundles the CLI with the SPA inside
node apps/server/dist/main.js samples/simple-web-app
```

This picks a random port and a random token, prints the URL and opens the browser. Useful flags:

```bash
node apps/server/dist/main.js <path> --port 8080 --no-open
node apps/server/dist/main.js --help
```

To try it as a global `fanri` command:

```bash
npm link -w apps/server
fanri samples/landing-zone/envs/dev
npm unlink -g fanri                         # undo
```

---

## 5. All scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | BE + FE in watch mode |
| `npm run build` | Production build (`apps/web/dist`, `apps/server/dist`) |
| `npm run check` | Lint + typecheck + tests. **Run this before every push** |
| `npm run typecheck` | `tsc` in every package (via turbo, cached) |
| `npm test` / `npm run test:watch` | Vitest, all `*.test.ts(x)` under `apps/` and `packages/` |
| `npm run lint` | Biome lint + format check |
| `npm run format` | Biome auto-fix (format + organize imports) |

Add a dependency to one package:

```bash
npm i zod -w packages/core
npm i -D @types/ws -w apps/server
npm i -D some-tool                          # root-level tool
```

Internal packages depend on each other with `"@fanri/core": "*"`, and npm links them from the workspace.

---

## 6. Project structure

```text
fanri/
├── apps/
│   ├── server/                  # BE: `fanri` CLI + Express local API  (npm name: fanri)
│   │   └── src/
│   │       ├── main.ts          #   CLI entry (commander)
│   │       ├── commands/        #   one file per CLI command
│   │       ├── config/          #   server config (host, port, token)
│   │       ├── common/          #   cross-feature code: middleware (host check, token, errors)
│   │       ├── features/        #   ★ feature modules
│   │       │   ├── health/      #     health.router.ts + index.ts
│   │       │   ├── graph/       #     graph.router.ts, graph.service.ts, index.ts
│   │       │   └── watch/       #     watch.gateway.ts (WebSocket)
│   │       ├── app.ts           #   Express app: mounts feature routers under /api
│   │       └── server.ts        #   http server + WebSocket, listen on 127.0.0.1
│   └── web/                     # FE: Vite + React SPA
│       └── src/
│           ├── main.tsx
│           ├── app/             #   App shell / layout
│           ├── features/        #   ★ feature modules
│           │   ├── graph/       #     zustand store: load IR, selection
│           │   ├── diagram/     #     React Flow canvas, IR → flow elements
│           │   ├── inspect/     #     detail panel
│           │   └── diagnostics/ #     parse messages bar
│           ├── shared/          #   cross-feature code: api client, ui, utils
│           └── styles/
├── packages/                    # shared libraries (TS source, no build step)
│   ├── core/                    #   IR schema (zod), loader, resolver, graph builder, plugin host
│   ├── parser-hcl/              #   Parser interface implementation (HCL → raw blocks)
│   └── plugin-aws/              #   AWS mappings
├── fixtures/                    # tiny Terraform inputs for automated tests
├── samples/                     # realistic Terraform for manual testing
│   ├── simple-web-app/          #   single root: EC2, SG, Route 53, data, import
│   ├── landing-zone/            #   org + YAML config + local/remote modules + dev/prod envs
│   └── private/                 #   your real infra. Gitignored
├── docs/                        # product and design docs (1–6)
├── .github/                     # PR template (CI later)
├── CONTRIBUTING.md
└── HOW_TO_RUN.md
```

### How a request flows

```text
browser ──/api/graph──▶ vite proxy (dev) ──▶ express app.ts
   ──▶ tokenAuth ──▶ features/graph/graph.router ──▶ graph.service
   ──▶ @fanri/core runPipeline: loadWorkspace → parser.parse → buildGraph → applyPlugins
   ──▶ FanriGraph (IR JSON) ──▶ web features/graph store ──▶ diagram / inspect / diagnostics
```

---

## 7. Adding code

### 7.1 A new BE feature (e.g. `export`)

```text
apps/server/src/features/export/
├── export.router.ts     # HTTP only: parse request, call service, send response
├── export.service.ts    # logic, no Express types
├── export.service.test.ts
└── index.ts             # public API: export * from "./export.router"
```

Then mount it in `apps/server/src/app.ts`:

```ts
api.use("/export", createExportRouter(config));
```

Rules: routers stay thin. Services never import `express`. Features import each other only through `index.ts`. Reusable non-HTTP logic belongs in `packages/core`.

### 7.2 A new FE feature (e.g. `search`)

```text
apps/web/src/features/search/
├── SearchBox.tsx
├── search.store.ts      # only if it has its own state
└── index.ts             # export * from "./SearchBox"
```

Use it from `app/App.tsx` via `import { SearchBox } from "@/features/search"`. Shared UI and helpers go in `src/shared/`.

### 7.3 Types shared by BE and FE

The IR types live in `packages/core/src/ir`. The web imports them from `@fanri/core/ir`, which is browser-safe. Never import `@fanri/core` itself in the web, because it pulls in Node's `fs`.

---

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `401 missing or invalid token` in the browser | Open the URL with `?t=dev` (dev) or the exact URL the CLI printed (prod) |
| `403 forbidden host` | Use `127.0.0.1` or `localhost`, not your LAN IP. This is intentional (DNS-rebinding protection) |
| `EADDRINUSE :4321` or `:5173` | A previous dev run is still alive. PowerShell: `Get-NetTCPConnection -LocalPort 4321 \| % { Stop-Process -Id $_.OwningProcess }` |
| Vite `http proxy error ECONNREFUSED` | The BE crashed or hasn't started. Check the `fanri:dev` lines in the terminal |
| `Cannot find module` after pulling | `npm install` (someone added a dependency) |
| Build: `web build not found` | Run `npm run build` from the **root** so the web builds first |
| Turbo seems stale | `npx turbo run <task> --force`, or delete `.turbo/` |
