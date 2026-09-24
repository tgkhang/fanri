# 6. Tech Stack

> **Status:** Draft v0.1 · **Builds on:** docs 1–5 (especially the architecture in doc 5 §5.5)
> Rule used for every choice: **local-first, OSS-licensed, fits a TypeScript developer, replaceable behind an interface.**

---

## 6.1 Summary

| Layer | Choice | Alternatives kept in mind |
| --- | --- | --- |
| Language | **TypeScript** (strict) everywhere | Go for the parser only, compiled to WASM (see §6.3) |
| Runtime | **Node.js LTS (≥ 22)** | Bun (faster startup, single-binary compile) |
| Monorepo | **pnpm workspaces** + Turborepo | Nx |
| HCL parsing | **`@cdktf/hcl2json`** for the spike → **own WASM build of `hashicorp/hcl`** as the long-term parser | tree-sitter-hcl, Go core |
| IR schema | **Zod** (runtime validation + TS types + JSON Schema export) | TypeBox |
| CLI | **commander** (or citty) + **open** (open browser) | oclif (heavier) |
| Local server | **Express 5** (HTTP) + **`ws`** (WebSocket) — see §6.4 | NestJS (if the server grows), Hono |
| File watching | **chokidar** | Node `fs.watch` |
| Web UI | **Vite + React 19** SPA (no SSR, doc 5 §5.9) | Next.js static export |
| Diagram | **React Flow (`@xyflow/react`)** | Cytoscape.js (very large graphs) |
| Layout | **ELK.js** in a **Web Worker** | Dagre (unmaintained, weak nesting) |
| UI kit | **Tailwind CSS + Radix UI / shadcn/ui** | Mantine |
| State | **Zustand** | Redux Toolkit |
| Export | `html-to-image` (PNG/SVG in browser). Custom SVG writer from the ELK result (headless). Generators for draw.io XML / Mermaid / D2 | Playwright screenshot (heavy) |
| Provider docs | `terraform providers schema -json` → trimmed snapshot bundled per plugin | Live call when Terraform is installed |
| Testing | **Vitest** (unit + IR snapshots), **Playwright** (UI e2e) | Jest |
| Lint/format | ESLint + Prettier (or **Biome**) | — |
| CI/CD | **GitHub Actions**, **Changesets** for versioning, npm publish | — |
| Distribution | `npx fanri` / `npm i -g fanri` → later single binary (Node SEA or `bun build --compile`), Homebrew/Scoop | Docker image |
| AI (optional, P6) | One `aiProvider` interface → **Ollama** (local), Anthropic / OpenAI / OpenRouter (your own key), or **agent CLI adapters** that run `claude -p` / `cursor-agent -p` as a child process **[to research]** | Vercel AI SDK as the adapter layer |
| License | **Apache-2.0** (patent grant, enterprise-friendly) | MIT |

---

## 6.2 Why TypeScript end-to-end

- Matches the author's skills (NestJS / Next.js / TS). The fastest path to the P1 "aha".
- One language for CLI, server, UI, and plugins, so plugin authors only need JS/TS and mostly write JSON/YAML mappings.
- IR types are shared by the parser, plugins, and UI with no code generation.
- The one weak spot is HCL parsing. It is handled by a WASM parser (below), so TS doesn't need to re-implement HCL.

## 6.3 HCL parser decision (most important technical risk)

| Option | Pros | Cons |
| --- | --- | --- |
| **`@cdktf/hcl2json`** | Ready-made WASM of HashiCorp's parser. Node + browser. `convertFiles(dir)`, `getReferencesInExpression` | **CDKTF itself was deprecated/sunset by HashiCorp (announced 2025), so future maintenance of this package is uncertain. Verify before relying on it.** Output loses some expression detail |
| **Own WASM build of `hashicorp/hcl/v2` (Go → WASM)** | Official parser, full expression AST and traversals (exact references), under our control | Build pipeline to maintain. WASM size (~several MB) |
| `tree-sitter-hcl` (web-tree-sitter) | Fast, incremental, error-tolerant, exact positions | Grammar-level only. Reference extraction and semantics are on us |
| Go core + `terraform-config-inspect` | Official, robust | Shallow by design (no resources in modules without more work). Splits the stack into two languages |

**Decision (draft):**

1. **P0/P1:** use `@cdktf/hcl2json` (pinned version) to get the pipeline working fast.
2. **Hide it behind `Parser` interface** (doc 5 §5.5). Nothing else imports the library directly.
3. **By P3:** replace it with a small Go package (`packages/hcl-wasm`) wrapping `hashicorp/hcl/v2` that emits exactly the raw blocks + traversals the IR needs. It becomes the long-term parser.
4. Keep an **IR snapshot test suite** so the swap is verified.

## 6.4 Local server: Express, not NestJS

- **Familiar:** the author already knows Express/NestJS, so there's nothing new to learn.
- **Small scope:** the server only serves the built SPA, a handful of JSON routes (IR, docs, export) and one WebSocket channel for watch-mode updates. Express handles that in a single file.
- **Why not NestJS:** DI container, decorators and `reflect-metadata` add startup time and bundle size to a CLI started with `npx`. They also complicate the single-binary build (Node SEA / `bun build --compile`). NestJS pays off for large multi-module backends, which fanri isn't.
- **Setup:** `express` 5 (native async error handling) + `ws` attached to the same `http.Server`. Middleware for the security rules in §6.8 (Host-header check, token, CSP).
- **Keep it swappable:** route handlers call core services and never touch `req`/`res` internals, so moving to NestJS later only replaces the thin HTTP layer.

## 6.5 Diagram & layout

- **React Flow:** custom nodes (icon + label + badges), **sub-flows for containers** (`parentId`, `extent: 'parent'`), hidden nodes for collapse/expand, built-in minimap/controls, good performance with hundreds of nodes.
- **ELK.js** (`layered` algorithm, `hierarchyHandling: INCLUDE_CHILDREN`) handles nested containers, which Dagre does badly. Run it in a **Web Worker** so the UI doesn't freeze.
- **Scaling plan** (NFR-3): collapse modules deeper than `collapseDepth`, lay out only visible subgraphs, cache layout results by IR hash. If > 2k visible nodes becomes common, test a Cytoscape.js renderer behind the same view-model interface.

## 6.6 Icons (licensing)

- AWS, Azure, and GCP publish architecture icon sets for diagram use, under their own terms (no modification, no use as logos).
- **Plan:** core ships **generic category icons** (own or MIT-licensed, e.g. Lucide). Each cloud plugin optionally provides vendor icons **only if the terms allow redistribution**. Otherwise a `fanri icons install aws` command downloads them to the user's machine from the vendor site (an explicit, opt-in network action).
- Verify each vendor's terms before P1 release (doc 2 §2.7).

## 6.7 Repository layout (proposal)

```
fanri/
├── packages/
│   ├── core/            # IR schema (zod), graph builder, module resolver, plugin host
│   ├── parser-hcl/      # Parser interface + hcl2json adapter (→ hcl-wasm later)
│   ├── hcl-wasm/        # (P3) Go + hashicorp/hcl/v2 → WASM
│   ├── cli/             # `fanri` command, local server (Express), exporters
│   ├── web/             # Vite + React + React Flow + ELK worker
│   ├── plugin-aws/      # mappings (JSON/YAML), containment rules, schema snapshot
│   ├── plugin-azure/    # (P4)
│   ├── plugin-gcp/      # (P4)
│   ├── plugin-template/ # starter for community providers
│   └── ai/              # (P6, optional) aiProvider + adapters. Core never imports it, so the no-AI build ships without it
├── fixtures/            # sample TF repos (aws-basic, aws-central-module, azure-rg, ...)
├── docs/                # these documents + user/contributor docs
└── .github/workflows/   # lint, test, snapshot, release
```

## 6.8 Security & privacy implementation notes

| Concern | Implementation |
| --- | --- |
| No outbound network by default | A single `net` gate in core. Every plugin declares `networkAccess`. A CI test fails if core modules import `http(s)`/`fetch` outside the gate |
| Local server exposure | Bind to `127.0.0.1`. Random port + random token. Check the `Host` header against DNS rebinding. Strict CSP on the SPA |
| Secrets in HCL | Mask sensitive attributes in the IR before sending to the UI (FR-6.6). Never log attribute values |
| Tier-2 fetch / shell | Only on explicit user action. Show the exact command. Use the user's existing git/terraform credentials, never store them |
| AI plugin | Off by default. Sends **IR excerpts**, not raw files. A preview of the payload before the first send. Local Ollama recommended. CLI adapters run the user's installed CLI with the prompt on stdin, and fanri stores no keys for them. Company repos only allow providers on an allow-list |
| Supply chain | Lockfile, `pnpm audit` in CI, minimal dependencies in `core`, signed releases (npm provenance) |

## 6.9 Testing strategy

| Level | What | Tool |
| --- | --- | --- |
| Unit | Reference extraction, module source classification, containment rules | Vitest |
| Snapshot | `fixtures/*` → IR JSON (determinism, NFR-5). Guards against parser regressions | Vitest snapshots |
| Plugin contract | Each plugin passes a shared conformance suite (mappings valid, no unknown categories) | Vitest |
| UI e2e | Open fixture → hover → expand → search → export | Playwright |
| Performance | Generated 300 / 2,000-resource repos → time budget (NFR-3) | Vitest bench / CI job |
| Real-world | Sanitized company repos run **locally only** (never committed) | Manual checklist |

## 6.10 Tooling for the author's workflow (Windows)

- Node LTS via **fnm** or **Volta**. pnpm through Corepack.
- Go toolchain only needed from P3 (hcl-wasm).
- Terraform CLI **optional**: only to generate schema snapshots and for Tier-2 actions.
- VS Code + ESLint/Prettier/Biome extensions. `fanri` also runs in WSL.

## 6.11 Decisions to confirm during scope validation

| # | Decision | Draft choice | Confirm by |
| --- | --- | --- | --- |
| D1 | Parser path | hcl2json for the spike → own hcl/v2 WASM | End of P0 spike |
| D2 | Server framework | Express 5 + `ws` | P1 start |
| D3 | License | Apache-2.0 | Before first public commit |
| D4 | Icon strategy | Generic core icons + opt-in vendor icon install | Before v0.1 release |
| D5 | Distribution | npm first, single binary later | v0.3 |
| D6 | AI adapter | Own thin interface (Ollama + Anthropic/OpenAI/OpenRouter + Claude Code / Cursor CLI adapters) | Spike before P6 (A7) |

## 6.12 Reference links

- React Flow <https://reactflow.dev/>
- ELK.js <https://github.com/kieler/elkjs>
- `@cdktf/hcl2json` <https://www.npmjs.com/package/@cdktf/hcl2json>
- hashicorp/hcl <https://github.com/hashicorp/hcl>
- terraform-config-inspect <https://github.com/hashicorp/terraform-config-inspect>
- tree-sitter-hcl <https://github.com/tree-sitter-grammars/tree-sitter-hcl>
- providers schema <https://developer.hashicorp.com/terraform/cli/commands/providers/schema>
- terraform show -json <https://developer.hashicorp.com/terraform/cli/commands/show>
- modules.json / `terraform modules` <https://developer.hashicorp.com/terraform/cli/commands/modules>
- Vite <https://vite.dev/>
- Express <https://expressjs.com/>
- ws <https://github.com/websockets/ws>
- Zod <https://zod.dev/>
- Ollama <https://ollama.com/> · AWS icons <https://aws.amazon.com/architecture/icons/>
- Azure icons <https://learn.microsoft.com/en-us/azure/architecture/icons/> · GCP icons <https://cloud.google.com/icons>
