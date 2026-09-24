# 3. Problem Statement

> **Status:** Draft v0.1 · **Builds on:** `1_user_research.md`, `2_product_research.md` · **Feeds into:** `4_solution.md`

---

## 3.1 Problem statement (one sentence)

**Cloud engineers who work across many Terraform repositories cannot quickly and safely understand what a repo deploys. The architecture is scattered across text files and hidden behind central modules that are not available locally. The tools that exist are stale, static, or require uploading confidential code.**

## 3.2 Point-of-view statement

> *A platform engineer managing ~1,000 AWS landing zones* **needs** *a fast, trustworthy, local way to see the architecture defined by any Terraform folder, including the parts delegated to central modules,* **because** *reading HCL file by file and asking AI to summarize it is slow, costly, inconsistent, and a compliance risk.*

## 3.3 Who is affected

| Persona (doc 1) | How they are affected |
| --- | --- |
| A — Landing-zone platform engineer | Loses hours per unfamiliar repo. Central modules block understanding |
| B — Terraform learner | Can't see how resources fit together. Docs are per resource, not per system |
| C — Onboarding / reviewing engineer | No up-to-date architecture view for pull requests and on-call |
| D — Security / architecture reviewer | Can't check boundaries and exposure at a glance |
| E — OSS contributor | Can't extend existing tools without changing their core |

## 3.4 Root causes

1. **Text vs graph mismatch.** Infrastructure is a graph of containment and references. HCL is flat text across many files.
2. **Module indirection.** An account repo only holds a `module` *call* (source, version, inputs). The resources are defined elsewhere and only become visible after `terraform init` and credentials.
3. **Pattern diversity.** Teams structure code differently, so no single mental model applies.
4. **Tooling gaps** (doc 2, §2.5): no local tool combines static parsing, deep hover, and graceful handling of unresolved modules.
5. **AI as a workaround.** It is non-deterministic and costs tokens because it reads whole files. For company code it may break data-handling rules unless it goes through the approved tool (Cursor). Nothing connects the AI tools people already have to a structured view of the repo.

## 3.5 Impact (current cost) **[estimates, to validate]**

| Dimension | Today |
| --- | --- |
| Time to understand an unfamiliar account repo | 30–120 min, longer if central modules must be cloned |
| Token cost | Repeated AI prompts for the same repos. Nothing is cached or shared |
| Risk | Missed dependencies in reviews. Company code shared with an AI tool that isn't approved |
| Knowledge | Hand-drawn diagrams go stale. Knowledge stays in people's heads |

## 3.6 How might we…

1. …turn any Terraform folder into a readable, interactive diagram **without credentials, `init`, or network access**?
2. …show **unresolved central modules** as useful boxes (source, version, inputs, inferred links) instead of gaps or errors?
3. …let users **inspect configuration and learn** what each attribute means, right on the diagram?
4. …support AWS, Azure, and GCP now, and let the community **add providers** without touching the core?
5. …add AI (through the tool the user already has, with minimal tokens) and live-cloud information **optionally**, without giving up determinism or privacy?

## 3.7 Scope boundary for the first releases

**In scope (first releases)**

- Local Terraform folder → interactive diagram (static HCL parsing).
- Local modules (`./modules/...`) expanded inline.
- External/central modules shown as **placeholder boxes**, and expanded when `.terraform/modules` already exists.
- Hover/click to inspect config. Search and filter. Export.
- AWS first. Plugin contract designed from day one for Azure and GCP.
- **No AI.** The first releases are the simple no-AI version, and it must be useful on its own. The AI plug-in comes later as an optional extra (a small spike may run earlier to test A7).

**Out of scope (for now, design the extension points only)**

- Editing infrastructure from the diagram (Brainboard-style design → code).
- Live cloud inventory, drift, cost, and security overlays.
- Hosted/SaaS version, accounts, multi-user collaboration.
- Full evaluation of `count`/`for_each`/computed values. Shown symbolically in v1.
- Terraform alternatives (OpenTofu should work if HCL is compatible, but is not tested at first; Pulumi and CloudFormation are out).

## 3.8 Constraints

| Type | Constraint |
| --- | --- |
| Privacy | By default: no network calls and no telemetry. Company code never leaves the machine. For public or personal repos, the user may opt in to cloud AI |
| Access | Must work with **zero** cloud credentials and without `terraform init` |
| Resources | Solo maintainer at first (side project). Scope must fit short sprints |
| Licensing | OSS-compatible dependencies. Respect vendor icon terms |
| Platform | Windows, macOS, Linux (the author uses Windows) |

## 3.9 Success criteria (how we know it's solved)

| # | Metric | Target (draft) |
| --- | --- | --- |
| S1 | Time from `fanri <folder>` to the diagram on a typical account repo | < 5 s for ≤ 300 resources |
| S2 | Share of real company repos that render without error (sanitized sample) | ≥ 95% |
| S3 | Central modules shown as placeholders instead of failing | 100% of unresolved calls |
| S4 | The author's time to understand an unfamiliar repo | Down ≥ 50% compared with today (self-measured) |
| S5 | AI tokens spent on "explain this repo" | Close to zero for structure questions |
| S6 | OSS signal after first public release | First external issue/PR. At least one community-contributed plugin mapping |
| S7 | Share of the author's repo questions answered by the **no-AI version alone** | ≥ 80% (validates A8) |
