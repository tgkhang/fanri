# 4. Solution

> **Status:** Draft v0.1 · **Builds on:** docs 1–3 · **Feeds into:** `5_ssr_app_feature.md`, `6_tech_stack.md`
> Framework: **SDVF**: **S**trategy, **D**esirability, **V**iability, **F**easibility.

---

## 4.1 Solution summary

**fanri** is an **open-source, local-first CLI with a local web UI.** It reads a Terraform folder and turns it into an **interactive, nested architecture diagram.**

- **Deterministic core:** static HCL parsing → a cloud-neutral graph model → automatic layout → interactive rendering. There is no AI in this path.
- **Two versions to research:** (1) the **simple no-AI version**, which is the base product, works on any repo, and needs no AI approval or tokens, and (2) the **no-AI version + AI plug-in**, an optional add-on. Version 1 must be worth using on its own.
- **Module-aware:** central/external modules appear as **placeholder boxes** (source, version, inputs, inferred links). They expand when the code is available.
- **Inspectable:** hover or click any node to see its configuration and attribute docs.
- **Extensible:** each cloud is a **plugin** (AWS → Azure → GCP → community: Alibaba, OCI…). Overlays (state, drift, cost, security, AI) plug into the same graph.
- **Private by default:** no network, no telemetry, no credentials needed. Opt-in AI can use the tool you already have (API key, Claude Code / Cursor CLI, or Ollama).

```
  ┌──────────────┐   ┌────────────┐   ┌───────────────┐   ┌────────────┐   ┌──────────────┐
  │ .tf folder   │──▶│ HCL parser │──▶│ Graph model   │──▶│ Layout     │──▶│ Web UI       │
  │ (+ modules)  │   │ + resolver │   │ + cloud plugin│   │ (ELK)      │   │ hover/expand │
  └──────────────┘   └────────────┘   └───────────────┘   └────────────┘   └──────────────┘
                                             ▲
                        overlays (later): plan/state · drift · cost · security · AI
```

---

## 4.2 Strategy

### Vision

*"Open any Terraform repo and see its architecture in seconds, without sharing a single line of code."*

### Positioning

| For | who | fanri is | that | unlike |
| --- | --- | --- | --- | --- |
| Cloud / platform engineers and Terraform learners | work in repos that call central modules and can't upload company code | a local, open-source Terraform visualizer | draws interactive, inspectable diagrams and handles unresolved modules gracefully | Rover/Inframap (stale or static), Terravision (no black-box modules or deep hover), Brainboard/Cloudcraft (paid SaaS) |

### Strategic pillars

1. **Deterministic first, AI second.** Correctness and trust come before cleverness. Every core feature works with AI turned off.
2. **Differentiate on module handling.** Tiered resolution (Tier 0 placeholders → Tier 3 hand-written supplements or AI guesses) is the flagship feature.
3. **Local-first as a trust signal.** No network by default. This is what opens enterprise and bank use. Network features are opt-in, per repo.
4. **Small core, many plugins.** Coverage grows through data-driven mappings the community can contribute.
5. **Learning is a first-class use case.** Hover docs, explanations, and a "what is this?" panel.

### Phased roadmap (strategy view; details in doc 5)

| Phase | Theme | Outcome |
| --- | --- | --- |
| **P0 — Spike** (≈1 wk) | Prove the loop | Parse a small AWS folder → render nested diagram |
| **P1 — MVP "aha"** | Code → diagram (AWS, local modules) | CLI + UI, containment, reference edges, pan/zoom |
| **P2 — Differentiator** | Central modules | Tier 0 placeholders + Tier 1 expansion from `.terraform/modules` |
| **P3 — Inspect & learn** | Hover/details | Provider-schema docs, search/filter, export |
| **P4 — Multi-cloud** | Azure, GCP + plugin SDK | Public plugin contract + contributor docs |
| **P5 — Resolve & supplement** | Tier 2/3 | Opt-in fetch, YAML "module contract", draw.io/D2/Mermaid export |
| **P6+ — Enrich** | Overlays | plan/state, drift, cost, security, AI plugin (a small spike earlier to validate A7), cloud CLI links, Vault |

### Open-source strategy

- **License:** Apache-2.0 or MIT for the core (to decide in doc 6). Compatible with MPL-2.0 dependencies.
- **Community hooks:** a "good first plugin" mapping template, a sample repos gallery, snapshot tests contributors can extend.
- **Distribution:** `npx fanri` / Homebrew / Scoop / single binary later.

---

## 4.3 Desirability — *Do people want it?*

| Evidence / signal | Strength |
| --- | --- |
| The author's own daily pain across ~1,000 landing zones (doc 1) | Strong (first-hand) |
| The central-module pain is shared by teams using a hub-and-spoke module pattern | Medium, **to validate (A1)** |
| The category exists: many tools were built (Rover, Inframap, Blast Radius, Terravision, Pluralith), paid products sell (Brainboard, Cloudcraft, Hava) | Strong: real demand |
| The free tools are stale or static. Interest in them remains (stars and issues on abandoned repos) | Medium: unmet demand |
| Enterprises can't use the SaaS options | Strong for regulated industries |
| Users already pay for AI tools (Cursor at work, Claude outside). Connecting fanri to them cheaply adds value without a new subscription | Medium, **to validate (A7)** |

**Desirability risks:** it may be "nice to have" rather than something users would pay for. It may only be desirable if the diagrams are **readable** at real scale (layout quality is make-or-break).
**Mitigation:** test on real repos in P1. Measure S1–S4 (doc 3).

## 4.4 Viability — *Is it worth sustaining?*

This is an OSS side project, so "viability" means **worth the maintainer's time, and it can stay alive.**

| Aspect | Assessment |
| --- | --- |
| Value to the author | High: solves own work pain, cuts AI token spend, and teaches Terraform deeply (the original goal) |
| Career / portfolio value | High: visible OSS project in a niche with little active competition |
| Cost to run | Near zero: no servers, no hosting (local tool). Only CI minutes |
| Maintenance load | Medium: provider schemas and resource types change. Mitigated by data-driven mappings and `providers schema -json` |
| Sustainability path | Community plugins. Possible later sponsorship. An optional hosted or enterprise edition stays **out of scope** |
| Adoption inside the company | Possible if the security team signs off on "no network by default" (A5) |

**Viability risks:** maintainer burnout, and Terravision (or HashiCorp/IBM) shipping the same features.
**Mitigation:** keep scope small per phase. Watch upstream every quarter (doc 2, §2.6 trigger).

## 4.5 Feasibility — *Can we build it?*

| Capability | Feasibility | Notes |
| --- | --- | --- |
| Parse HCL statically | ✅ High | Mature parsers exist (`hashicorp/hcl`, hcl2json, tree-sitter-hcl). See doc 6 |
| Infer edges from references | ✅ High | References such as `aws_vpc.main.id` can be extracted from expressions |
| Nested containers + auto-layout | ⚠️ Medium | React Flow + ELK.js supports it. Tuning for readability takes effort |
| Hover docs | ✅ High | `terraform providers schema -json`, bundled or generated per plugin |
| Unresolved modules (Tier 0/1) | ✅ High | Module call metadata + `.terraform/modules/modules.json` |
| Tier 2 fetch (private git/registry) | ⚠️ Medium | Credential handling, many auth types. Opt-in only |
| `count`/`for_each`/computed values | ⚠️ Medium–Low (static) | Show symbolically in v1 ("×N"). Full accuracy comes from plan/state later |
| Multi-cloud plugins | ✅ High | Same graph model. Only the mappings differ |
| AI plugin | ✅ High / ⚠️ CLI path unverified | Standard LLM calls, or a headless agent CLI (`claude -p`, `cursor-agent -p`). The hard parts are validation, privacy UX, keeping token use low, and CLI output formats that may change |

**Skills fit:** the author knows TypeScript/Next.js/NestJS and has deep AWS/Terraform domain knowledge. The UI stack matches, and the parsing is well understood.

---

## 4.6 Alternatives considered

| Alternative | Why not (for now) |
| --- | --- |
| AI-first like GitDiagram (LLM reads repo → diagram) | Non-deterministic, costs tokens, privacy risk. IaC is already machine-readable |
| Plan/state-only input (like Rover) | Needs `init`, credentials, and backend access, which kills the "open any repo" use case. Keep it as an optional front-end |
| Static image output (Graphviz/D2 only) | No hover, expand, or learning. Keep as export formats |
| VS Code extension first | Good second channel. A web UI is simpler to build first and can be embedded in a webview later |
| Contribute to Terravision | Different architecture (static render, Python). Revisit if the trigger in doc 2 happens |

## 4.7 Key risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Diagrams unreadable on large repos | Med | High | Collapse by default, group by module/VPC, filter by type, focus mode |
| Parser dependency abandoned (e.g. CDKTF-based libs) | Med | Med | Hide the parser behind an interface. Keep a fallback (see doc 6) |
| Icon licensing blocks redistribution | Low–Med | Med | Don't bundle vendor icons in core. Load them from the plugin or user setup |
| Scope creep (drift, AI, CLI links…) | High | High | Strict phase gates. Enrichment only after P4 |
| Solo maintainer capacity | High | Med | Short sprints, a public roadmap, contributor-friendly plugins |

---

## 4.8 Verdict — continue & name it "fanri"?

**Yes, it's worth continuing.** The research shows:

1. **No existing tool** meets local-first + unresolved-module handling + deep hover together (doc 2, §2.3).
2. The **flagship feature** (central-module placeholders) directly addresses the author's biggest daily pain and an unsolved gap in the market.
3. The cost is low (local tool, no infrastructure), the stack fits the author's skills, and even an MVP (P1–P2) pays back personally and teaches Terraform deeply.

**Condition:** re-check doc 2 §2.7 (especially Terravision's latest features) before starting P1. If Terravision already offers black-box modules **and** attribute hover, switch to contributing upstream.

→ **Recommendation: adopt "fanri" as the project name** and move to the requirements (doc 5).
