# 5. Software Requirements Specification (SRS), App Features & Architecture Design

> **Status:** Draft v0.1 · **Builds on:** docs 1–4 · **Feeds into:** `6_tech_stack.md`
> **Note on "SSR":** this document treats it as **SRS, the Software Requirements Specification** (features + requirements). Server-Side Rendering is covered in §5.9: fanri does **not** need it.

---

## 5.1 Purpose & scope

This document lists what fanri v1.x must do (functional requirements), how well it must do it (non-functional requirements), and how it is structured (architecture). It covers phases **P0–P5** from doc 4. P6+ appears only as extension points.

**Priority key (MoSCoW):** **M** = Must (MVP) · **S** = Should · **C** = Could · **W** = Won't (this release)
**Phase key:** P1…P6 as in doc 4 §4.2.

---

## 5.2 Feature map

```txt
fanri
├── F1 Input & Loading         (folder, files, ignore rules, workspaces)
├── F2 Parsing & Graph Model   (HCL → IR: resources, data, modules, vars, outputs, edges)
├── F3 Module Resolution       (local, Tier 0–3 external/central modules)
├── F4 Cloud Plugins           (AWS, Azure, GCP; containment, icons, edge rules)
├── F5 Layout & Rendering      (nested containers, auto-layout, collapse/expand)
├── F6 Inspect & Learn         (hover, detail panel, schema docs, source links)
├── F7 Navigate                (search, filter, focus, minimap)
├── F8 Export & CLI            (PNG/SVG/JSON/draw.io/Mermaid/D2, headless, batch)
├── F9 Overlays (extension)    (plan/state, drift, cost, security, live cloud)
└── F10 AI Assistant (plugin)  (explain, summarize, guess black boxes) — off by default
```

**F1–F9 are the simple no-AI version.** They must be complete and useful without F10. F10 is an optional add-on.

---

## 5.3 Functional requirements

### F1 — Input & Loading

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-1.1 | `fanri <path>` loads all `*.tf` (and `*.tf.json`) files in a root folder | M | P1 |
| FR-1.2 | Starts a local server and opens the browser at `http://127.0.0.1:<port>` | M | P1 |
| FR-1.3 | Ignores `.terraform/` (except the module manifest, see F3) and `.git/`, and respects `.fanriignore` | S | P1 |
| FR-1.4 | Watch mode: re-parses on file change and live-updates the diagram | S | P3 |
| FR-1.5 | Recognizes multiple root modules / environments in a repo (`envs/dev`, `envs/prod`) and offers a picker | S | P3 |
| FR-1.6 | Reads `*.tfvars` to show variable values where they are literals | C | P3 |

### F2 — Parsing & Graph Model

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-2.1 | Parses `resource`, `data`, `module`, `variable`, `output`, `locals`, `provider`, `terraform` blocks into a cloud-neutral **Intermediate Representation (IR)** (§5.6) | M | P1 |
| FR-2.2 | Extracts references from expressions (`aws_vpc.main.id`, `module.x.y`, `var.z`, `local.w`) and creates **reference edges** | M | P1 |
| FR-2.3 | Adds edges for explicit `depends_on` | M | P1 |
| FR-2.4 | Shows `count` / `for_each` resources as **one node with a multiplicity badge** (`×N` or `×?`) | M | P1 |
| FR-2.5 | Records the source location (file, line) for every node | M | P1 |
| FR-2.6 | Syntax errors in one file do not abort the whole parse. The file gets an error marker | M | P1 |
| FR-2.7 | Accepts `terraform show -json` (plan/state) as an **alternative front-end** into the same IR | C | P6 |

### F3 — Module Resolution (flagship)

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-3.1 | **Local modules** (`source = "./..."` / `"../..."`) are parsed recursively and shown as **expandable containers** | M | P1 |
| FR-3.2 | **Tier 0:** external modules (git, registry, http, s3…) that can't be resolved appear as **placeholder boxes** with name, source, version, inputs, and inferred edges, marked *unresolved* | M | P2 |
| FR-3.3 | Edges into a placeholder are inferred from its inputs (inputs that reference root resources). Edges out come from uses of `module.x.<output>` | M | P2 |
| FR-3.4 | **Tier 1:** if `.terraform/modules/modules.json` exists, the module `Dir` is resolved and expanded into a real container | M | P2 |
| FR-3.5 | **Tier 1b:** the user can map a module source to a local checkout (`fanri.config.yaml: moduleMappings`), e.g. a cloned central-module repo | S | P2 |
| FR-3.6 | **Tier 2 (opt-in):** "Fetch" action runs `terraform init -backend=false` or a git/registry download with credentials the user provides. Never automatic | C | P5 |
| FR-3.7 | **Tier 3:** a YAML **module contract** describes the expected contents of a module (resources, outputs), rendered as *supplemented* (a distinct style) | S | P5 |
| FR-3.8 | **Tier 3b:** the AI plugin may propose a contract ("likely contents") marked **AI guess**, which the user must accept | C | P6 |
| FR-3.9 | A legend always shows the resolution status: resolved / local / supplemented / guessed / unresolved | M | P2 |

### F4 — Cloud Plugins

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-4.1 | Core has **no cloud-specific code**. All provider knowledge lives in plugins (§5.7) | M | P1 |
| FR-4.2 | AWS plugin v1: icon/category mapping, containment (account → region → VPC → subnet → resource), security-group/IAM edge hints | M | P1 |
| FR-4.3 | Unknown resource types show as a **generic node** (type label + provider color). Nothing is dropped | M | P1 |
| FR-4.4 | Azure plugin (subscription → resource group → VNet → subnet) | S | P4 |
| FR-4.5 | GCP plugin (project → VPC → subnetwork) | S | P4 |
| FR-4.6 | Plugins are loadable from npm packages or a local folder. A documented contract and a template are provided | S | P4 |
| FR-4.7 | Community providers (Alibaba, OCI…) need no core changes | S | P4 |

### F5 — Layout & Rendering

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-5.1 | Automatic hierarchical layout with nested containers | M | P1 |
| FR-5.2 | Pan, zoom, fit-to-screen, minimap | M | P1 |
| FR-5.3 | Collapse/expand any container (module, VPC, resource group). Collapsed containers show a child count | M | P2 |
| FR-5.4 | Default view collapses modules deeper than N levels to stay readable | S | P2 |
| FR-5.5 | Toggle edge types (references / depends_on / network / IAM) | S | P3 |
| FR-5.6 | Light/dark theme | C | P3 |
| FR-5.7 | Manual node dragging, with the layout remembered per repo (local file) | C | P5 |

### F6 — Inspect & Learn

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-6.1 | **Hover tooltip:** type, name, key attributes (plugin-selected), resolution status | M | P3 |
| FR-6.2 | **Detail panel on click:** all configured attributes with raw expressions, references in and out, source file:line | M | P3 |
| FR-6.3 | Attribute **descriptions and docs** from the provider schema (`terraform providers schema -json` or bundled snapshot) | S | P3 |
| FR-6.4 | "Open in editor" link (`vscode://file/...`) | S | P3 |
| FR-6.5 | Module panel: inputs passed, outputs used, source/version, "where else is this module used" (within the repo) | S | P3 |
| FR-6.6 | Sensitive-looking values (`password`, `secret`, `token`, `sensitive = true`) are **masked** by default | M | P3 |

### F7 — Navigate

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-7.1 | Search by name / type / attribute value | M | P3 |
| FR-7.2 | Filter by provider, resource category, module | S | P3 |
| FR-7.3 | Focus mode: select a node → show only its N-hop neighborhood ("blast radius") | S | P3 |

### F8 — Export & CLI

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-8.1 | Export PNG / SVG of the current view | M | P3 |
| FR-8.2 | Export IR as JSON (stable, versioned schema) | M | P3 |
| FR-8.3 | Export draw.io / Mermaid / D2 | S | P5 |
| FR-8.4 | Headless: `fanri export <path> --format svg -o out.svg` (for CI, PR comments, wikis) | S | P5 |
| FR-8.5 | Batch: `fanri export --batch repos.txt` for many repos (landing-zone scale) | C | P5 |
| FR-8.6 | Self-contained static HTML export (viewable offline, shareable) | C | P5 |

### F9 — Overlays (extension points only in v1)

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-9.1 | Overlay plugin API: decorate nodes/edges with badges, colors, extra panel sections | S | P4 |
| FR-9.2 | Plan diff overlay (create/update/delete) from `terraform show -json plan` | C | P6 |
| FR-9.3 | Drift overlay from `terraform plan -refresh-only` output | C | P6 |
| FR-9.4 | Live cloud enrichment through AWS/Azure/GCP CLI (user's own credentials, opt-in) | W | P6+ |
| FR-9.5 | Remote state readers (S3, Azure Blob, HCP Terraform), Vault for secrets | W | P6+ |
| FR-9.6 | Cost (Infracost) and security (Checkov/Trivy) overlays | W | P6+ |

### F10 — AI Assistant (optional plugin)

| ID | Requirement | Pri | Phase |
| --- | --- | --- | --- |
| FR-10.1 | **Disabled by default.** Enabling it needs an explicit config and shows what will be sent | M (if built) | P6 |
| FR-10.2 | Providers behind one `aiProvider` abstraction: local Ollama, your own API key (Anthropic / OpenAI / OpenRouter), or an **agent CLI** already installed and logged in (Claude Code `claude -p`, Cursor `cursor-agent -p`). fanri never stores the CLI's credentials **[to research]** | C | P6 |
| FR-10.3 | "Explain this node / module" using the IR (not raw files) as context → **small token usage** | C | P6 |
| FR-10.4 | Black-box guess (FR-3.8). Output is **validated against the IR schema** and labeled as a guess | C | P6 |
| FR-10.5 | Responses are cached locally per (IR hash, question) | C | P6 |
| FR-10.6 | **Token budget:** each request sends only the selected node/module and its direct neighbours from the IR. Show the estimated token count before sending. Configurable maximum per request | C | P6 |
| FR-10.7 | **Per-repo privacy:** `company` repos only use providers on an allow-list (e.g. the company-approved Cursor). `public` repos can use any configured provider | C | P6 |

---

## 5.4 Non-functional requirements

| ID | Category | Requirement |
| --- | --- | --- |
| NFR-1 | **Privacy** | Zero outbound network calls by default. No telemetry. Every network feature is opt-in and listed in `fanri doctor`. Network use can be allowed per repo (e.g. public GitHub repos) |
| NFR-2 | **Security** | Server binds to `127.0.0.1` only, with a random session token in the URL. No shell execution unless the user triggers a Tier-2 action. Secrets masked (FR-6.6) |
| NFR-3 | **Performance** | ≤ 300 resources: diagram in < 5 s. ≤ 2,000 resources: < 15 s with collapsed modules. UI stays at ≥ 30 fps when panning |
| NFR-4 | **Robustness** | Partial/invalid HCL degrades gracefully (FR-2.6). ≥ 95% of the sample repos render (doc 3, S2) |
| NFR-5 | **Determinism** | Same input → same IR → same layout (stable IDs, sorted inputs). Snapshot-testable |
| NFR-6 | **Portability** | Windows, macOS, Linux. No Terraform binary required for core features |
| NFR-7 | **Extensibility** | New provider = new plugin package. Core untouched. IR schema is versioned (semver) |
| NFR-8 | **Usability** | One command to start. Understandable legend. Keyboard shortcuts for search/fit |
| NFR-9 | **Accessibility** | Color is never the only signal (status also uses icon/border style). Tooltips reachable by keyboard |
| NFR-10 | **Maintainability** | Core test coverage ≥ 80%. Fixture repos per plugin. Conventional commits |
| NFR-11 | **Licensing** | All dependencies OSS-compatible. Vendor icons not redistributed in core unless their terms allow it |
| NFR-12 | **Works without AI** | Every feature in F1–F9 works with AI disabled and no AI provider installed. The AI plug-in is a separate package the core does not depend on |

---

## 5.5 Architecture overview

**Style:** pipeline (parse → model → enrich → layout → render) + **plugin architecture** (microkernel). Local client/server: a small Node process does file access and parsing, and the browser SPA renders.

```
┌───────────────────────────────── fanri CLI process (Node, localhost only) ─────────────────────────────────┐
│                                                                                                            │
│  ┌──────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐   ┌───────────────┐   │
│  │ Loader   │──▶│ Parser Front-ends│──▶│ Module Resolver  │──▶│ Graph Builder (IR) │──▶│ Plugin Host   │   │
│  │ fs/watch │   │ • HCL (default)  │   │ Tier0/1/1b/2/3   │   │ nodes, edges,      │   │ • cloud: aws, │   │
│  │ ignore   │   │ • plan/state JSON│   │ modules.json     │   │ containers, refs   │   │   azure, gcp  │   │
│  └──────────┘   │   (later)        │   │ moduleMappings   │   └────────────────────┘   │ • overlays    │   │
│                 └──────────────────┘   └──────────────────┘              │             │ • ai (opt-in) │   │
│                                                                          ▼             └───────┬───────┘   │
│                                                         ┌──────────────────────────┐           │           │
│                                                         │ Enriched IR (versioned)  │◀──────────┘           │
│                                                         └────────────┬─────────────┘                       │
│   ┌──────────────────────────┐                                       │                                     │
│   │ Local API (HTTP + WS)    │◀──────────────────────────────────────┘                                     │
│   │ GET /graph, /node/:id    │     ┌────────────────────┐                                                  │
│   │ WS: change events        │     │ Exporters (headless)│ svg/png/json/drawio/mermaid/d2                  │
│   └────────────┬─────────────┘     └────────────────────┘                                                  │
└────────────────┼───────────────────────────────────────────────────────────────────────────────────────────┘
                 │ http://127.0.0.1:<port>?t=<token>
┌────────────────▼─────────────────────────── Browser SPA ───────────────────────────────────────────────────┐
│  IR → view model → ELK.js layout (Web Worker) → React Flow canvas                                          │
│  Hover tooltip · Detail panel · Search/filter · Collapse/expand · Legend · Export                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Responsibility | Key interfaces |
| --- | --- | --- |
| **Loader** | Find root modules, read files, ignore rules, file watching | `loadWorkspace(path) → FileSet` |
| **Parser front-end** | HCL → raw blocks + expression references. Pluggable (HCL, plan JSON) | `Parser.parse(FileSet) → RawModule` |
| **Module Resolver** | Classifies each `module.source` (local/git/registry/…) and applies tiers | `resolve(call) → Resolved \| Placeholder` |
| **Graph Builder** | Builds the IR: nodes, containment, reference edges, multiplicity | `build(RawModule tree) → IR` |
| **Plugin Host** | Loads cloud/overlay/AI plugins, runs hooks in order | `CloudPlugin`, `OverlayPlugin` (§5.7) |
| **Local API** | Serves IR and node details. Pushes changes over WebSocket | REST + WS, token-protected |
| **Exporters** | Server-side headless rendering for the CLI and CI | `export(IR, format)` |
| **Web SPA** | Layout (ELK in a Web Worker), rendering (React Flow), interaction | Consumes IR JSON only |

**Key design rule:** the **IR is the contract.** Parsers produce it, plugins decorate it, the UI and exporters consume it. That lets you swap the parser (TS → Go/WASM), add plan/state input, or build a VS Code extension later without redesigning.

---

## 5.6 Intermediate Representation (IR), draft schema

```ts
interface FanriGraph {
  schemaVersion: "0.1";
  root: string;                       // root module path
  nodes: GNode[];
  edges: GEdge[];
  diagnostics: Diagnostic[];          // parse errors, unresolved refs
}

type NodeKind = "resource" | "data" | "module" | "variable" | "output" | "local" | "provider" | "group";

interface GNode {
  id: string;                         // stable: "module.net.aws_subnet.private"
  kind: NodeKind;
  type?: string;                      // "aws_subnet"
  name: string;
  provider?: string;                  // "aws" | "azurerm" | "google" | ...
  parentId?: string;                  // containment (module / VPC / RG / group)
  multiplicity?: { mode: "count" | "for_each"; expr: string; value?: number };
  attributes: Record<string, AttrValue>; // literal or { expr, refs[] }
  source: { file: string; line: number };
  module?: {                          // only for kind = "module"
    source: string; version?: string;
    sourceKind: "local" | "git" | "registry" | "http" | "s3" | "other";
    resolution: "local" | "resolved" | "supplemented" | "guessed" | "unresolved";
    inputs: Record<string, AttrValue>;
  };
  view?: { icon?: string; category?: string; label?: string; badges?: Badge[] }; // set by plugins
}

interface GEdge {
  id: string; from: string; to: string;
  kind: "reference" | "depends_on" | "network" | "iam" | "module_input" | "module_output" | string;
  via?: string;                       // attribute path, e.g. "subnet_id"
  inferred?: boolean;
}
```

---

## 5.7 Plugin contract, draft

```ts
interface CloudPlugin {
  name: string;                        // "aws"
  providers: string[];                 // ["aws"] — provider prefixes handled
  resources: Record<string, ResourceMapping>; // data-driven, mostly JSON/YAML
  containment?: ContainmentRule[];     // e.g. aws_subnet inside aws_vpc via vpc_id
  edgeRules?: EdgeRule[];              // e.g. security_groups → "network" edge
  keyAttributes?: Record<string, string[]>; // shown in hover tooltip
  schema?: () => Promise<ProviderSchema>;   // bundled snapshot of providers schema -json
}

interface ResourceMapping {
  category: "compute" | "network" | "storage" | "database" | "security" | "iam" | "integration" | "monitoring" | "other";
  icon?: string;                        // key into plugin icon pack
  label?: string;
  isContainer?: boolean;                // VPC, resource group, project...
}

interface OverlayPlugin {
  name: string;
  optIn: true;                          // overlays never run by default
  networkAccess: boolean;               // declared, shown to user
  decorate(graph: FanriGraph, ctx: OverlayContext): Promise<FanriGraph>;
}
```

**Hook order:** parse → resolve modules → build IR → `CloudPlugin` containment/edge rules → `OverlayPlugin.decorate` (opt-in) → layout → render.

---

## 5.8 Key flows

### Flow A — open a repo (P1)

1. `fanri ./account-repo` → Loader finds `.tf` files → Parser → RawModule tree.
2. Resolver: `./modules/*` → parse recursively. External → placeholder (Tier 0), or expand if `modules.json` has it (Tier 1).
3. Graph Builder → IR → AWS plugin adds containment/icons → IR served at `/graph`.
4. Browser fetches IR → ELK layout in a worker → React Flow renders → user hovers/expands.

### Flow B — central module (P2)

```
module "network" { source = "git::https://git.corp/modules/vpc?ref=v3.2" ; cidr = var.cidr }
         │
         ├─ .terraform/modules/modules.json has key "network"? ──yes──▶ parse Dir → expandable container (resolved)
         ├─ fanri.config.yaml moduleMappings matches source?   ──yes──▶ parse mapped path (resolved, Tier 1b)
         ├─ module contract file exists?                        ──yes──▶ render contract (supplemented)
         └─ otherwise ─────────────────────────────────────────────────▶ placeholder box (unresolved)
                                                                         shows source, ref, inputs; edges from
                                                                         inputs + module.network.* usages
```

---

## 5.9 About SSR (Server-Side Rendering): not needed

| Question | Answer |
| --- | --- |
| Do we need SSR (Next.js server rendering)? | **No.** No SEO, no public pages, no per-request personalization. The data is local and the heavy work is parsing (Node) + layout/render (browser) |
| What instead? | A **static SPA** (Vite + React), bundled inside the CLI package and served by the local Node server |
| When would SSR / a server matter? | Only for a future hosted/demo site (e.g. a public showcase of sample repos). Even then, static export is enough |
| Server-side *image* rendering? | Yes for headless export (FR-8.4): render SVG on the server/CLI side. This is not SSR in the web-framework sense |

---

## 5.10 Configuration file (draft)

```yaml
# fanri.config.yaml (optional, in repo root or ~/.fanri/)
plugins: ["@fanri/plugin-aws"]
collapseDepth: 2
moduleMappings:                         # Tier 1b
  - match: "git::https://git.corp/modules/vpc*"
    path: "../central-modules/vpc"
moduleContracts: "./.fanri/contracts"   # Tier 3 YAML
network: false                          # master switch; Tier 2 / AI / overlays require true
ai:
  enabled: false
  provider: ollama                      # ollama | anthropic | openai | openrouter | claude-cli | cursor-cli
  repoPrivacy: company                  # company (allow-listed providers only) | public
  maxTokensPerRequest: 2000
```

---

## 5.11 Release plan (requirements → phase)

| Release | Includes | Exit criteria |
| --- | --- | --- |
| **v0.1 (P1)** | F1.1–1.3, F2.1–2.6, F3.1, F4.1–4.3, F5.1–5.2 | Renders 5 real sanitized AWS repos. NFR-1/2/5 met |
| **v0.2 (P2)** | F3.2–3.5, F3.9, F5.3–5.4 | All unresolved modules shown as placeholders (S3) |
| **v0.3 (P3)** | F6, F7, F8.1–8.2, F1.4–1.6, F5.5 | Hover/detail usable by a learner (A6 test) |
| **v0.4 (P4)** | F4.4–4.7, F9.1 | Azure + GCP fixtures pass. Plugin template documented |
| **v0.5 (P5)** | F3.6–3.7, F8.3–8.6 | Headless export used in one CI pipeline |
| **v0.6+ (P6)** | F2.7, F9.2–9.6, F10 | Each overlay opt-in, network use declared |

## 5.12 Open questions for scope validation

1. Is Tier 1b (map a source to a local clone) enough for the company's central modules, so Tier 2 is rarely needed?
2. Should batch export (FR-8.5) move earlier, given the 1,000-landing-zone use case?
3. Is a VS Code extension more wanted than a browser UI (A4)?
4. Which AWS resource categories must look good in v0.1 (e.g. VPC, TGW, IAM, S3, KMS, Lambda, EKS)?
5. Which AI plug-in path works best: API key, Claude Code CLI, or Cursor agent CLI? Is the Cursor CLI allowed at work (A7)?
6. Should a small AI spike move before P6 to validate A7 early?
