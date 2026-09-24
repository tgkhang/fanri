# Building a Terraform-to-Diagram Tool: Should You Build It, and How

## TL;DR

- **Build it.** No existing tool cleanly does what you want: feed a Terraform folder → interactive, hover-rich, nested architecture diagram that gracefully handles unresolved central/external modules as expandable "black boxes." The closest tools (Terravision, Inframap, Rover, Pluralith) each miss at least one of: local-first privacy, hover-to-inspect config, graceful unresolved-module handling, or active maintenance.
- **GitDiagram is a poor architectural template for your use case** — it is a cloud SaaS (Next.js on Vercel + Cloudflare R2 + Upstash Redis) that makes an LLM call to *guess* architecture from a repo tree/README. For Terraform you want the opposite: **deterministic static HCL parsing, local-first, AI optional (BYO key / Ollama).**
- **Recommended stack:** a local CLI + local web UI (like Rover), parsing with `@cdktf/hcl2json` (TS) or `hashicorp/terraform-config-inspect` (Go), rendering with **React Flow + ELK.js** (best-in-class for nested containers, collapse/expand, hover), a provider-agnostic core + per-cloud plugins, and provider schemas for hover tooltips.

---

## Key Findings

1. **GitDiagram is an AI SaaS, not a parser.** It fetches a repo's file tree + README via the GitHub API, sends it to an LLM to produce a plain-English explanation and then a structured graph AST, which a deterministic compiler turns into Mermaid rendered in-browser. It is MIT-licensed (16.7k stars, 1.3k forks), Next.js 16 / React 19 on Vercel, uses OpenAI (or OpenRouter). Its "architecture" is a guess, acceptable for code repos but **wrong for IaC**, where the folder deterministically defines the infrastructure.

2. **The Terraform-diagram space is real but fragmented and under-maintained.** Free/OSS tools (Rover, Inframap, Blast Radius, `terraform graph`, Terravision) are mostly stale or produce messy output; the polished ones (Brainboard, Cloudcraft, Hava, Lucidscale) are paid SaaS that send your code/state to the cloud — a problem for a bank.

3. **The central/external module problem is genuinely unsolved.** No mainstream tool renders an un-downloaded module as an expandable placeholder node. They either download-and-expand (needs credentials/init) or silently skip/error. This is your clearest differentiator.

4. **Static HCL parsing is the right foundation, not plan/state.** It needs no cloud creds, no `terraform init`, no state access — ideal for local-first privacy and for a learning tool. Plan/state JSON is a valuable optional enrichment path later.

5. **AI should be an optional plugin, not the engine.** Deterministic parsing gives correct, reproducible diagrams. Reserve the LLM for learning value: explaining resources, summarizing modules, and *guessing* the likely contents of unresolved black-box modules — all behind a BYO-key / local-Ollama toggle so no company code leaves the machine by default.

---

## Details

### 1. GitDiagram Architecture (analyzed from the repo)

**What it is:** "Turn any public or private GitHub repository into an interactive architecture diagram in seconds." MIT license, 16.7k stars / 1.3k forks.

**Stack:**

- Frontend/app: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Radix UI
- API: same-origin Next.js Route Handlers on Vercel's Bun runtime (there is no separate FastAPI/Postgres backend anymore — the README explicitly notes the older FastAPI/Neon design was removed)
- Storage: Cloudflare R2 (diagram artifacts)
- Coordination: Upstash Redis (quota, cancellation, locks, short-lived failure state)
- AI: OpenAI by default, OpenRouter for self-host, chosen via `AI_PROVIDER`
- Analytics: PostHog; Deployment: Vercel (a Railway/Docker recipe is kept only for disaster recovery)

**Pipeline (end-to-end):**

1. Fetch default branch, recursive file tree, and README via GitHub API; reject truncated trees / oversized inputs before any model work.
2. **Model stage 1:** stream a plain-English architecture explanation.
3. **Model stage 2:** return a strict, size-bounded graph AST (groups, nodes, edges, shapes, labels, descriptions, repo paths).
4. **Validation:** server validates identifiers, connectivity, limits, and every linked path against the real repo tree; invalid output is retried with focused feedback.
5. **Deterministic compiler** converts the validated AST → Mermaid (full text escaping, GitHub-only links).
6. Browser sanitizes source, renders Mermaid in strict security mode, sanitizes the SVG, re-enforces a link allowlist.
7. Successful artifacts are persisted (R2) so revisits skip another model call.

**LLM usage:** Yes, central to it. Per a third-party write-up it uses roughly one main model request at medium reasoning for the graph, with extra calls only for repairs/recovery. Model identity has shifted over time (Claude 3.5 Sonnet → OpenAI o3-mini → newer OpenAI models); the repo now abstracts this behind `AI_PROVIDER`. **Large repos:** handled by *bounded ingestion* (rejecting truncated/oversized trees, sampling) — not by true whole-repo analysis. **Cost/rate limits:** managed via Upstash Redis quota accounting; 300-second Vercel function budget. **Caching:** R2 keyed by repo (separate protected namespace for private repos).

**Verdict for you:** Borrow three ideas — (a) two-stage "explain then structure," (b) **validate model output against ground truth before rendering**, (c) deterministic compiler from a validated AST to the diagram. Discard the SaaS topology and the "AI guesses architecture" core; your architecture is *known* from the HCL.

Official links: React Flow <https://reactflow.dev/> · Mermaid <https://mermaid.js.org/> · Next.js <https://nextjs.org/docs>

### 2. Tool Survey & Comparison

Verdict up front: **there is no single tool good enough to just adopt** given your constraints (local-first for a bank, hover-to-inspect resource config, graceful central-module handling, multi-cloud, active maintenance, free/OSS). Terravision is the closest OSS option and worth studying/contributing to; Brainboard/Cloudcraft are the closest polished products but are paid SaaS and not local-first.

| Tool | Free/Paid | Maintained | Input | Clouds | Remote/external modules | Interactivity (hover config) | Drift | Local-first |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **terraform graph** (built-in) | Free | Yes (core) | HCL/plan → DOT | All | Shows module nodes, no expansion | No (static DOT→Graphviz) | No | Yes |
| **Inframap** (cycloidio) | Free, MIT | Low activity | tfstate or HCL | AWS/Azure/GCP/OpenStack special-cased | Limited | No (static image) | No | Yes |
| **Rover** (im2nguyen) | Free, MIT | Stale (last release v0.3.3, Jul 2022; no release since) | plan/state + config | All (via TF) | Via plan expansion | Some (interactive web UI, resource tree) | Change highlight | Yes (local :9000) |
| **Blast Radius** | Free, MIT | Abandoned | HCL (terraform graph) | All | No expansion | Interactive d3 (limited) | No | Yes |
| **Terravision** (patrickchugh) | Free, MPL-2.0 | Active | HCL (client-side) or plan/graph files | AWS (full), GCP/Azure core | **Clones git modules to ~/.terravision; auto-downloads** | Interactive HTML (click/pan/zoom/search) | No | Yes (100% client-side) |
| **Pluralith** | Freemium (hosted backend) | **Dropped/inactive** (CLI last commit 2023; open "project dropped?" issue) | plan | AWS strongest | Via plan | Dashboard | Some | CLI local, backend hosted |
| **Brainboard** | Paid ($99/user/mo Pro, or $999/user/yr; free "forever" design tier) | Active | Design→TF, or import TF | AWS/Azure/GCP/OCI/Scaleway | Public + private TF modules supported | Rich (visual designer) | Yes | No (SaaS) |
| **Cloudcraft** (Datadog) | Freemium; Pro $40.83/user/mo annual ($99 monthly); Enterprise $100/mo annual ($120 monthly) | Active but slowing | Live cloud import / manual | AWS, Azure (no GCP) | N/A (reads live infra) | Rich isometric | Via re-import | No (SaaS) |
| **Hava.io** | Paid; Professional $59/mo, Teams $249/mo (limited free tier) | Active | Live cloud / TF state | AWS/Azure/GCP | N/A | Rich | Yes | No (SaaS) |
| **Lucidscale / Cloudockit / Holori** | Paid | Active | State/live/import | Multi | Varies | Rich | Varies | No (SaaS) |
| **Firefly** | Paid (freemium) | Active | Cloud scan + state | Multi | N/A (inventory) | Rich | Yes (inventory drift) | No (SaaS) |
| **Spacelift / env0 / HCP Terraform** | Paid platforms | Active | plan/state | Multi | Yes | Platform UI | Yes (scheduled plan) | No |

Notes on the free/OSS group: Inframap "reads your tfstate or HCL to generate a graph specific for each provider, showing only the resources that are most important/relevant" but oversimplifies and drops resources; on larger plans both `terraform graph` and Inframap produce unreadable auto-scaled output. Rover runs locally on `:9000` and highlights plan changes but "becomes messy when infra is large" and is effectively unmaintained (last release v0.3.3, July 2022). Terravision is the standout: MPL-2.0, active, 100% client-side, uses official cloud icon sets, exports interactive HTML and editable draw.io, and now has optional local-Ollama AI annotations — but its interactivity is diagram-level (click/search), not deep hover-into-resource-attributes, and it *resolves* modules by cloning rather than offering a black-box fallback.

**Gaps that justify a new tool:** (1) local-first **and** deep hover-to-inspect resource attributes; (2) first-class handling of unresolved central/external modules (collapsible placeholders, user supplementation); (3) an extensible provider-plugin model that a learner/community can grow; (4) an actively maintained, modern web-interactive OSS option (most OSS here is stale or produces static images).

Official links: Rover <https://github.com/im2nguyen/rover> · Inframap <https://github.com/cycloidio/inframap> · Terravision <https://github.com/patrickchugh/terravision> · Blast Radius <https://github.com/28mm/blast-radius> · terraform graph <https://developer.hashicorp.com/terraform/cli/commands/graph> · Brainboard <https://www.brainboard.co/> · Cloudcraft <https://www.cloudcraft.co/> · Hava <https://www.hava.io/> · Firefly <https://www.firefly.ai/>

### 3. Handling Central / External Modules (your key design challenge)

Your scenario: an account repo calls `module "vpc" { source = "git::https://internal/modules/vpc" ... }`. Research confirms:

- **Static parse without `terraform init` gives you only the module *call*** — `source`, `version`, and the input arguments — never the module's internal resources. `terraform-config-inspect` does deliberately "shallow parsing" and "only works at the level of single modules… some of which may be references to remote packages"; its `ModuleCall` struct has `Name/Source/Version/Pos` and no resource fields. `@cdktf/hcl2json` likewise just transforms the text present on disk into JSON.
- **To resolve internals you need the module downloaded.** `terraform init` / `terraform get` copy remote modules into `.terraform/modules/` and write a `modules.json` manifest mapping each module `key` → `source`, `version`, and on-disk `Dir`. Reading that manifest is how a tool locates and expands child-module resources.
- **The Terraform Registry protocol** (service identifier `modules.v1`, base `https://registry.terraform.io/v1/modules/`) exposes version lists and provider dependencies via HTTP, but **not** full inputs/outputs/resources — you still must download the source archive to parse internals. Private registries (HCP Terraform / TFE) use the same protocol with a bearer token.
- **How others handle it:** Terravision clones git module sources to `~/.terravision/` and auto-downloads; Infracost auto-downloads public modules but requires explicit credentials for private git (SSH key) or private registry (token). Neither offers a placeholder for unresolved modules — they resolve or error. **No mainstream tool draws unresolved modules as expandable black boxes** — this is your differentiator.

**Recommended design (tiered resolution):**

1. **Tier 0 — always works, offline:** parse the root; render each external `module` block as a **collapsed placeholder node** labeled with its name, `source`, `version`, and the inputs passed in. Draw edges you can infer purely from the call (e.g., which inputs reference which root resources). Mark it visually as "unresolved."
2. **Tier 1 — resolve if already present:** if `.terraform/modules/modules.json` exists, read `Dir` and expand the real child resources into the (now expandable) container.
3. **Tier 2 — opt-in fetch:** offer actions to run `terraform init -backend=false` / `terraform get`, or a direct git/registry fetch with credentials the user supplies, then re-expand. Keep this explicit and off by default (bank privacy).
4. **Tier 3 — supplement / AI guess:** let users hand-annotate a module's likely contents (a YAML "module contract" akin to Terravision's annotations), or optionally ask the AI plugin to *guess* typical contents of, say, a "vpc" module — clearly labeled as a guess.

Official links: terraform-config-inspect <https://github.com/hashicorp/terraform-config-inspect> · `terraform modules` / modules.json <https://developer.hashicorp.com/terraform/cli/commands/modules> · module registry protocol <https://developer.hashicorp.com/terraform/internals/module-registry-protocol> · `terraform init` <https://developer.hashicorp.com/terraform/cli/commands/init>

### 4. Recommended Technology & Architecture

**A. HCL parsing**

- **If you build in TypeScript (recommended, matches your NestJS/Next.js background):** use **`@cdktf/hcl2json`** (MPL-2.0) — WASM-compiled from HashiCorp's `hcl2json`, works in Node and the browser, has `parse`, `convertFiles(dir)`, and `getReferencesInExpression` (invaluable for edge inference between resources). <https://www.npmjs.com/package/@cdktf/hcl2json>
- **If you build in Go:** use **`hashicorp/terraform-config-inspect`** for shallow metadata + **`hashicorp/hcl/v2`** for deeper attribute/expression parsing. <https://github.com/hashicorp/hcl>
- **Other options:** `python-hcl2` (Python, Lark-based) <https://github.com/amplify-education/python-hcl2> ; `tree-sitter-hcl` (editor-grade incremental parsing) ; `tfparse` (Python wrapping AquaSec's Go parser, does interpolation).
- **Static HCL vs plan/state JSON:** Static HCL needs no creds/init/state → best default for privacy and learning; downside is unresolved computed values, `count`/`for_each` expansion, and external modules. `terraform show -json` (plan or state) gives fully-resolved resources and real dependency data but needs a plan/state and possibly cloud access. **Design the core to accept both**: an HCL front-end and a plan/state front-end feeding one common graph model. <https://developer.hashicorp.com/terraform/cli/commands/show>

**B. Resource metadata for hover tooltips**

- Use **`terraform providers schema -json`** to get every resource type's attributes + descriptions for rich hover panels. <https://developer.hashicorp.com/terraform/cli/commands/providers/schema>
- Cloud icons (all free for architecture diagrams, with restrictions — don't distort, keep colors, don't build logos): **AWS Architecture Icons** <https://aws.amazon.com/architecture/icons/> · **Azure Architecture Icons** <https://learn.microsoft.com/en-us/azure/architecture/icons/> · **GCP icons** <https://cloud.google.com/icons> . Store per-plugin; respect each vendor's terms (Azure/AWS/GCP permit diagram use but reserve other rights).

**C. Diagram rendering — recommendation: React Flow + ELK.js**

- **React Flow (xyflow)** — best fit: native **nested/sub-flow containers** (`parent`/`extent: 'parent'`, `type: 'group'`) for VPC→subnet→resource containment, custom nodes for hover panels and icons, and community patterns for **collapse/expand** (built-in Pro example, plus free `hidden`-attribute approaches). <https://reactflow.dev/>
- **ELK.js** for automatic layout (handles nested subgraphs well; React Flow ships an ELK example). <https://github.com/kieler/elkjs> ; Dagre is simpler but **unmaintained** and weaker at nesting. <https://github.com/dagrejs/dagre>
- **Alternatives:** **Cytoscape.js** (great for very large graphs/compound nodes) <https://js.cytoscape.org/> ; **D2** (excellent *static* nested-container diagrams, MPL-2.0, multiple layout engines incl. ELK/TALA — good as an export format) <https://d2lang.com/> ; **Mermaid** (easy, GitHub-native, but weak nesting/interactivity) <https://mermaid.js.org/> ; **Graphviz** (what most OSS tools emit; static). For your interactive/hover/collapse requirements, **React Flow + ELK.js wins**; offer D2/Mermaid/Graphviz/PNG as export targets.

**D. Web framework / delivery — recommendation: local-first CLI + local web UI**

- **Privacy is paramount (bank code must not leave the machine).** Follow the Rover/Terravision model: a CLI that parses locally and serves a local web UI (e.g., `localhost:9000`). SSR is **not** needed — the heavy lifting is parsing + client-side graph rendering; a static/client-rendered SPA (or Next.js in static-export/`output: 'export'` mode) is sufficient. <https://nextjs.org/docs/app/building-your-application/deploying/static-exports>
- **Packaging options, in order:** (1) CLI + local web UI (fastest to build, matches your SRE workflow); (2) **VS Code extension** (excellent for a code→diagram learning loop; webview renders React Flow) <https://code.visualstudio.com/api> ; (3) desktop app via **Tauri** (Rust shell, tiny, secure) <https://tauri.app/> or Electron <https://www.electronjs.org/> . Start with (1).

**E. Plugin / extensible architecture — provider-agnostic core + per-cloud plugins**
Model your plugin system on how these projects structure provider logic:

- **Inframap** has per-provider packages (`provider/aws`, `provider/google`, …) with a `PreProcess` hook that adds provider-specific edges, and node/edge type lists per provider — a clean template. <https://github.com/cycloidio/inframap>
- **tfsec/Trivy, Checkov, Infracost, Steampipe** all use per-provider/per-resource rule or mapping sets — study them for how to keep a small typed core and grow coverage via data-driven mappings. Infracost <https://www.infracost.io/docs/> ; Checkov <https://www.checkov.io/> ; Trivy <https://trivy.dev/> ; Steampipe <https://steampipe.io/>
- **Core contract:** a plugin maps `resource_type` → { node visual/icon, containment rules (e.g., `aws_subnet` nests in `aws_vpc`), edge-inference rules (references, security groups, IAM), grouping hints }. Ship AWS first, then Azure, then GCP, with a schema so the community can add Alibaba/OCI later.

**F. AI / LLM — optional plugin only**

- **Deterministic parsing is the engine.** Use AI only where it adds *learning* value: explain what a resource/block does, summarize a module, suggest logical groupings/layout, and **guess likely contents of unresolved black-box modules** (clearly labeled as a guess).
- **Privacy-first:** AI off by default; **BYO API key** (OpenAI/OpenRouter/Anthropic) or **local models via Ollama** <https://ollama.com/> so nothing leaves the machine. This mirrors Terravision's optional Ollama/Bedrock/OpenAI-compatible annotation design and GitDiagram's `AI_PROVIDER` abstraction.
- Borrow GitDiagram's discipline: if the LLM emits structure, **validate it against the parsed HCL before rendering.**

**G. Future enrichment (design seams now)**

- **Live cloud enrichment:** optional adapters calling AWS CLI/SDK, Azure CLI, GCP APIs to annotate nodes with live state. AWS CLI <https://docs.aws.amazon.com/cli/> · Azure CLI <https://learn.microsoft.com/en-us/cli/azure/> · gcloud <https://cloud.google.com/sdk/gcloud>
- **Remote state readers:** S3, Azure Blob, HCP Terraform/Enterprise state → feed the plan/state front-end. <https://developer.hashicorp.com/terraform/language/settings/backends/s3>
- **Secrets:** HashiCorp Vault for any credentials used in Tier-2 module fetch. <https://developer.hashicorp.com/vault/docs>
- **Drift overlay:** `terraform plan -refresh-only` is the supported primitive; **driftctl is deprecated/maintenance-mode since Dec 2023** (its README says: "This project is now in maintenance mode. We cannot promise to review contributions. Please feel free to fork the project") — note alternatives (HCP Terraform/Spacelift/env0 scheduled plans; small OSS CLIs like tfdrift/terradrift; `terraform plan -detailed-exitcode` on a schedule). <https://developer.hashicorp.com/terraform/cli/commands/plan>
- **Cost overlay:** Infracost (parses HCL directly, AWS/Azure/GCP) <https://www.infracost.io/> .
- **Security overlay:** Checkov / Trivy. Design these as post-parse "overlay" plugins that decorate existing nodes.

### 5. Suggested MVP Sprint Roadmap

- **Sprint 0 (spike, ~1 wk):** Prove the core loop — parse a small AWS folder with `@cdktf/hcl2json`, build a naive graph model, render with React Flow + ELK.js. Decide TS vs Go (recommend TS).
- **Sprint 1 — Code→Diagram, single cloud, local modules only:** CLI + local web UI. Parse root + local (`./`) modules. AWS plugin v1: resource→node/icon mapping, VPC/subnet containment, reference-based edges. Pan/zoom/auto-layout. **Ship the "aha."**
- **Sprint 2 — External/central module handling (your differentiator):** Tier 0 placeholder nodes (name/source/version/inputs), collapse/expand containers, "unresolved" styling. Tier 1: read `.terraform/modules/modules.json` and expand when present.
- **Sprint 3 — Hover details:** load `terraform providers schema -json`; hover panel shows resource attributes + descriptions; click node → full config/attributes; search/filter.
- **Sprint 4 — Multi-cloud plugins:** Azure plugin (resource groups as containers), then GCP. Formalize the plugin contract + docs so contributors can add providers.
- **Sprint 5 — Tier-2 resolution + supplementation:** opt-in `terraform init -backend=false`/`get`, git/registry fetch with user creds; YAML "module contract" for hand-supplementing unresolved modules; export to D2/Mermaid/PNG/draw.io.
- **Sprint 6+ — Enrichment overlays:** plan/state front-end (`terraform show -json`), remote-state readers, drift overlay (`plan -refresh-only`), Infracost cost overlay, Checkov/Trivy security overlay, optional AI plugin (BYO key / Ollama) for explanations, module summaries, and black-box guessing.

---

## Recommendations

1. **Build it as open source, TypeScript, local-first.** The gap is real and your stack (NestJS/Next.js/TS) maps directly to `@cdktf/hcl2json` + React Flow. A bank-friendly, offline, hover-rich, module-aware OSS tool has no direct competitor today.
2. **Anchor the MVP on deterministic static HCL parsing** and get Sprint 1 (single-cloud, local-modules, interactive diagram) shipped fast — that alone beats Inframap/Blast Radius for your learning goal and is your credibility proof.
3. **Make unresolved-module black boxes a first-class feature from Sprint 2.** It's the one thing no competitor does and it's exactly your company's pain (account repo → central module repo).
4. **Keep AI optional and BYO/local.** Ship value without it; add it as a learning accelerator behind a clear privacy toggle.
5. **Study, and consider contributing to, Terravision** (MPL-2.0, active, client-side, official icons) before writing everything from scratch — you may fork its icon/mapping work or contribute your interactive/black-box features upstream rather than duplicating.

**Benchmarks that would change the plan:** If Terravision (or another active OSS tool) ships deep hover-to-attribute inspection **and** expandable unresolved-module placeholders, reassess build-vs-contribute — contributing would then be higher-leverage. If your company standardizes on HCP Terraform/Spacelift, lean on their state APIs for enrichment instead of building readers.

## Caveats

- **Model identity in GitDiagram shifts over time** (Claude 3.5 → o3-mini → newer OpenAI); treat any specific model name as point-in-time. The "one model call at medium reasoning" detail comes from a third-party blog, not the repo README — treat as indicative.
- **Icon licenses are permissive but conditional:** AWS/Azure/GCP allow diagram use but prohibit distortion and reserve other rights; review each vendor's terms before redistributing icons in an OSS repo (consider not vendoring icons, or using an aggregator that tracks licenses).
- **`terraform-config-inspect` is intentionally shallow** — it won't expand modules or evaluate expressions; for `count`/`for_each`/computed values you'll need `hcl/v2` expression evaluation or the plan/state path.
- **Registry protocol does not expose full module inputs/outputs/resources** — you must download source to parse internals; plan Tier-2 fetch accordingly.
- **Some OSS tools are effectively dead** (Pluralith "project dropped?" issue open; Blast Radius abandoned; Rover last release July 2022) — don't build on them as dependencies; study them for ideas only.
- Prices cited (Brainboard $99/user/mo, Cloudcraft $40.83/user/mo annual, Hava from $59/mo) are point-in-time from each vendor's pricing page; verify current pricing before decisions.

# PS: Original Prompt

đọc giúp tôi repo này, tôi đang muốn làm 1 cái tool để tôi học terraform ý tưởng giống repo này thôi, là khi đưa folder terraform của aws hoặc azzure vào thì nó visualize lên thành digram cho dễ nhìn, ko biết có tool nào free có sẵn, hay trả phí ko, giúp tôi tìm hiểu có thì tôi xài thôi còn nếu ko thì tôi sẽ viết nó open source, 

đưa tôi tài liệu ssr, công nghệ nên sử dụng, AI plugin? có nên ko, hay là logic tôi cũng ko rõ gitdiagram ở trên dùng công nghệ gì có AI call bên trong hay ko nữa,
hmm một lưu ý là tôi thấy trong cty tôi ngoài repo terraform của 1 tài khoản nó hay gọi tới 1 central module khác nên tính năng bổ sung/ làm ẩn những phần chưa rõ cũng phải có trong ứng dụng nếu làm, các tính năng cơ bản như đưa chuột đọc thông số cấu hình console trên ứng dụng, thông số các service, ... thiết kế cũng phải ổn định để dễ dàng đưa thêm service , plugin vào, có 3 loại cloud thiết kế cho azure, aws và google, hoặc thiết kế tốt để mở rộng cho alibaba,... nếu thêm trong tương lai, tính năng còn khá nhiều tôi chưa nghĩ hết vd link với aws cli để lấy thêm thông tin từ account, link vault hay state lấy drift ,.. nói chung là tôi nghĩ đc khá nhiều cái hay ,m trước mấy sprint vẫn nên là từ tf code -> diagram visualize