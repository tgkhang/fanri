# 2. Product Research (Market & Competitor Analysis)

> **Status:** Draft v0.1 · **Builds on:** `1_user_research.md` · **Feeds into:** `3_problem_statement.md`
> Facts come from the research in `idea.md`. Stars, prices, and maintenance status are **point-in-time**. Re-check them before the final scope decision (§2.7).

---

## 2.1 Research questions

1. Is there a free or paid tool that already does "Terraform folder → interactive diagram" well enough to **just use**?
2. If not, what gaps remain, and are they the ones our personas care about (doc 1, §1.6)?
3. What can we **borrow** (ideas, data, code) instead of building from scratch?

## 2.2 Evaluation criteria (from the persona needs)

| Code | Criterion | Why it matters |
| --- | --- | --- |
| C1 | **Local-first** (no upload of code or state by default) | Hard requirement for company/bank code. Public or personal repos may opt in to cloud AI |
| C2 | **Static HCL input** (no creds, no `init`, no state) | Works on any repo right away. Good for learning |
| C3 | **Unresolved external/central modules** handled gracefully | Pain P2, the sharpest pain |
| C4 | **Hover / click to inspect** resource config | Persona A and B need |
| C5 | Nested containers + readable auto-layout | Readability at scale |
| C6 | Multi-cloud + **extensible** provider model | AWS/Azure/GCP now, Alibaba/OCI later |
| C7 | Actively maintained, free/OSS | Safe to adopt or build on |
| C8 | **Useful without AI** (AI is an optional extra) | Works on company repos with no AI approval, gives the same answer every time, and costs no tokens |

---

## 2.3 Competitor landscape

### Free / open source

| Tool | License | Maintained | Input | Clouds | External modules | Hover config | Local-first |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `terraform graph` (built-in) | BUSL (Terraform) | Yes | HCL/plan → DOT | All | Module node only, no expansion | No (static) | Yes |
| **Inframap** (cycloidio) | MIT | Low activity | tfstate or HCL | AWS/Azure/GCP/OpenStack | Limited | No (static image) | Yes |
| **Rover** | MIT | Stale (last release v0.3.3, Jul 2022) | plan/state + config | All | Through plan expansion | Partial (web UI, resource tree) | Yes (localhost:9000) |
| **Blast Radius** | MIT | Abandoned | HCL via `terraform graph` | All | No | Limited (d3) | Yes |
| **Terravision** | MPL-2.0 | **Active** | HCL (client-side) or plan/graph | AWS full, GCP/Azure core | **Clones/downloads** git modules | Click/pan/zoom/search, **not deep attribute hover** | Yes |
| **Pluralith** | Freemium | Dropped (last commit 2023) | plan | AWS strongest | Through plan | Dashboard | Partial (hosted backend) |

### Paid / SaaS

| Tool | Pricing (point-in-time) | Input | Notes | Local-first |
| --- | --- | --- | --- | --- |
| **Brainboard** | ~$99/user/mo Pro, free design tier | Design ↔ TF, import TF | Visual designer, supports private modules, drift | No |
| **Cloudcraft** (Datadog) | ~$40.83/user/mo annual | Live cloud import | Isometric, AWS + Azure, no GCP | No |
| **Hava.io** | From ~$59/mo | Live cloud / state | Auto diagrams, drift | No |
| Lucidscale / Cloudockit / Holori | Paid | State / live | Documentation diagrams | No |
| Firefly | Freemium/paid | Cloud scan + state | Inventory and drift, not a code visualizer | No |
| Spacelift / env0 / HCP Terraform | Platform pricing | plan/state | Resource views inside a CI/CD platform | No |

### Fit against the criteria

| Tool | C1 | C2 | C3 | C4 | C5 | C6 | C7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| terraform graph | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Inframap | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Rover | ✅ | ❌ (needs plan) | ⚠️ | ⚠️ | ⚠️ | ✅ | ❌ |
| Terravision | ✅ | ✅ | ⚠️ (download or fail) | ⚠️ | ✅ | ⚠️ | ✅ |
| Brainboard / Cloudcraft / Hava | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ (paid) |

**Conclusion:** no tool meets **C1 + C3 + C4 together**. Terravision comes closest among the OSS tools. The paid tools are polished but rule themselves out on C1.

---

## 2.4 Reference architecture studied: GitDiagram

GitDiagram was the original inspiration, so we studied it in detail.

- **What it is:** a SaaS that turns a GitHub repo into a Mermaid architecture diagram. MIT, about 16.7k stars.
- **Stack:** Next.js 16 / React 19 on Vercel. Cloudflare R2 for artifacts. Upstash Redis for quotas and locks. OpenAI or OpenRouter through `AI_PROVIDER`.
- **Pipeline:** GitHub API (file tree + README) → **LLM stage 1**: explanation → **LLM stage 2**: strict graph AST → **server validation against the real tree** → **deterministic compiler** to Mermaid → sanitized render → cached in R2.
- **Does it use AI internally?** Yes. The LLM is the core: it **guesses** architecture from file names and the README.

**Verdict for fanri:**

| Borrow | Discard |
| --- | --- |
| Validate any AI output against ground truth before rendering | "AI guesses the architecture." For IaC, the code **defines** the architecture deterministically |
| Intermediate AST/graph model → deterministic compiler to diagram | SaaS topology (Vercel, R2, Redis, quotas) |
| Provider abstraction for AI (`AI_PROVIDER`) | Sending code to a cloud model by default |

---

## 2.5 Gap analysis → opportunity

| Gap in the market | Persona pain (doc 1) | Opportunity for fanri |
| --- | --- | --- |
| G1. No tool draws **unresolved modules as expandable placeholder boxes**. Tools either download them or skip/fail | P2 | **Main differentiator:** tiered module resolution |
| G2. No local-first tool with **deep hover-to-inspect** attributes and schema docs | P3, learning | Hover panel powered by `terraform providers schema -json` |
| G3. Most OSS tools are **stale or produce static images** | P5 | Modern, maintained, interactive web UI |
| G4. Provider logic is **hard-coded**. Adding a cloud means changing the core | Persona A (advocacy: contributors) | Data-driven per-cloud plugins |
| G5. AI tools send code to the cloud and give different answers each run | P4 | Deterministic core. AI is an optional plug-in: your own key, an agent CLI you already have (Claude Code / Cursor), or local Ollama |
| G6. No tool is built for **batch** use across many repos | P6 | CLI export mode (later) |

---

## 2.6 Build vs buy vs contribute

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **Buy** (Brainboard/Cloudcraft/Hava) | Polished, available today | SaaS: fails C1 for a bank. Cost per user. Weak on the central-module case | ❌ |
| **Use as-is** (Terravision) | Free, active, local | No black-box modules, no deep hover, Python/Graphviz core that is hard to make richly interactive | ⚠️ Use it as a reference |
| **Contribute** to Terravision | Existing icons, mappings, users | Different architecture (static render). Our main features are UI-heavy and would be a large redesign upstream | ⚠️ Revisit if upstream adds G1 + G2 |
| **Build** fanri (OSS) | Fills G1–G5, and a strong learning vehicle for the author | Effort, maintenance, and icon licensing | ✅ **Recommended** |

**What would change this decision:** if Terravision, or another active OSS tool, ships **both** deep attribute hover **and** expandable unresolved-module placeholders, switch to contributing.

---

## 2.7 Open items to verify before the final scope

- [ ] Re-check the Terravision release notes and roadmap (it moves fast; it recently added Ollama annotations).
- [ ] Re-check the Rover, Inframap, and Pluralith maintenance status.
- [ ] Re-check pricing for Brainboard, Cloudcraft, and Hava.
- [ ] Search again for new entrants, including IDE plugins and HashiCorp/IBM native features (HCP Terraform explorer views).
- [ ] Check the terms for the AWS, Azure, and GCP architecture icons for OSS redistribution.
- [ ] Check how Claude Code (`claude -p`) and Cursor's agent CLI (`cursor-agent -p`) can be called from another program: output format, login, rate limits, and licence terms.

## 2.8 Useful links

- Rover <https://github.com/im2nguyen/rover>
- Inframap <https://github.com/cycloidio/inframap>
- Terravision <https://github.com/patrickchugh/terravision>
- Blast Radius <https://github.com/28mm/blast-radius>
- terraform graph <https://developer.hashicorp.com/terraform/cli/commands/graph>
- Brainboard <https://www.brainboard.co/>
- Cloudcraft <https://www.cloudcraft.co/>
- Hava <https://www.hava.io/>
- Firefly <https://www.firefly.ai/>
- GitDiagram <https://github.com/ahmedkhaleel2004/gitdiagram>
