# 1. User Research

> **Status:** Draft v0.1 (for validation) · **Working name:** fanri (Terraform → interactive architecture diagram, open source)
> **Feeds into:** `2_product_research.md` → `3_problem_statement.md`

---

## 1.1 Research goal

Find out **who** has trouble understanding Terraform codebases, **when** it happens, and **what they do today**. That tells us what the first version must do and what can wait.

Sources for this draft:

- The author's own experience. The author is the primary user (see Persona A).
- Notes and observations from `idea.md`.
- The AI tools the author already uses: Cursor at work, Claude outside work. Privacy rules differ between company repos and public or personal repos.
- Assumptions that still need checking. They are marked **[ASSUMPTION]** and listed in §1.7.

---

## 1.2 Primary persona — "The Landing-Zone Platform Engineer"

| Attribute | Detail |
| --- | --- |
| Persona description | Cloud / platform engineer who manages about **1,000 AWS landing zones / accounts**. Works across many account repos, each calling **central/shared modules** kept in other repos (`git::https://internal/modules/...`). Uses Terraform CLI, git, AWS CLI, an IDE, and AI assistants when stuck (Cursor at work, Claude outside work) |
| Demographic | Mid-to-senior engineer in a regulated enterprise (banking). AWS today; Azure and GCP also show up in the organization **[ASSUMPTION]** |
| Psychographic | Values accuracy and repeatability over "clever" answers. Privacy-conscious about **company** code: it **must not leave the machine**, or may only go to the company-approved AI (Cursor), so SaaS diagram tools with uploads are ruled out for work repos. Personal or public GitHub code is fine to send to cloud AI (Claude). Curious, and wants to keep learning, not just get the job done |
| Motivation | Understand infra quickly, review changes safely, and **learn Terraform more deeply** |
| Moments that matter | Opening an unfamiliar account repo · hitting a central module that isn't available locally · reviewing a pull request · onboarding a colleague or explaining a design · learning a new service or pattern |

**What the author said:**
> "A lot of people modify the code using different patterns. Some use a central module, which makes it really hard to visualize and detect what's going on. I usually need to ask AI to read it, which wastes tokens."

**Jobs to be done**

1. *When I open an unfamiliar account repo,* I want to see what it deploys and how the pieces connect, *so I can* understand it in minutes, not hours.
2. *When a repo calls a central module I don't have locally,* I want to see which module it is and which inputs it gets, *so I'm* not blocked by missing code.
3. *When I review a change,* I want to hover over a resource and see its configuration, *so I don't* have to jump between files.
4. *When I learn a new service or pattern,* I want the diagram to explain what each block does, *so the* tool also teaches me.

## 1.3 Pain points

| # | Pain point | Impact |
| --- | --- | --- |
| P1 | **Inconsistent patterns across repos.** Each team structures Terraform differently: flat, module-heavy, wrappers of wrappers | High cognitive load. No mental model carries over from one repo to the next |
| P2 | **Central/external modules are opaque.** The account repo only shows a `module` call. The real resources live somewhere else | The picture is incomplete. You must clone other repos and run `terraform init` just to understand the code |
| P3 | **Reading HCL is linear and file-based.** Architecture is a graph, but code is text spread across many `.tf` files | Slow, and it's easy to miss dependencies |
| P4 | **Using AI to read the repo wastes tokens and results vary.** It's also unclear whether sending the code is allowed | Cost, compliance risk, and answers that differ each time you ask |
| P5 | **Existing diagram tools are stale, static, or SaaS.** See `2_product_research.md` | No tool you can trust and use locally |
| P6 | **Too many accounts to inspect by hand.** 1,000 landing zones | You need something repeatable and scriptable, not a one-off effort |

**Current workarounds**

- Grep and IDE "go to definition" through `.tf` files. Clone the central module repos by hand.
- Paste code into an AI chat and ask for an explanation. This costs tokens and is a compliance grey area.
- Run `terraform graph | dot`. The output is unreadable at scale.
- Draw diagrams by hand in draw.io. They go stale immediately.

---

## 1.4 Secondary personas

### Persona B — "The Terraform Learner"

| Attribute | Detail |
| --- | --- |
| Persona description | Engineer who is new to Terraform, or moving from another cloud or tool. Knows the basics but can't yet picture how a whole system fits together |
| Demographic | Junior engineer, 0–2 years with Terraform **[ASSUMPTION]**. Often in the same platform or app teams as Persona A |
| Psychographic | Eager to learn, and prefers learning by exploring real code over reading docs page by page. Can feel intimidated by large, module-heavy repos |
| Motivation | See how resources relate (VPC → subnet → instance) and what each attribute means. Documentation is per resource, and nothing shows the whole system |
| Moments that matter | First week on a team · first time reading a real landing-zone repo · meeting a new service or attribute · preparing a first pull request |

### Persona C — "The Onboarding / Reviewing Engineer"

| Attribute | Detail |
| --- | --- |
| Persona description | New team member, reviewer on a pull request, or SRE on call who needs a quick overview of a repo they didn't write |
| Demographic | Mid-level to senior engineer (platform, app, SRE, or security / architecture reviewer) in the same organization |
| Psychographic | Time-pressed and pragmatic. Wants the answer in minutes and doesn't trust architecture docs, because they are usually out of date |
| Motivation | Know what a repo deploys and what a module call affects, check network boundaries, IAM and public exposure, and share a diagram in the PR or wiki |
| Moments that matter | Reviewing a pull request · being paged on an unfamiliar account · onboarding onto a new team · a design or compliance review against the landing-zone standard |

---

## 1.5 Customer journey, Persona A

| Stage | Customer goal | Action / behavior | Touchpoint | Thoughts / mindset | Emotion | Pain point |
| --- | --- | --- | --- | --- | --- | --- |
| Awareness | Understand an unfamiliar account repo fast | Skims folders in the IDE, greps `.tf` files, pastes code into AI, tries `terraform graph \| dot` | IDE, AI chat, colleagues, GitHub / search results, blog posts | "There must be a better way to see what this deploys" | Frustrated, overloaded | Code is linear text but the architecture is a graph (P3). Central modules are opaque (P2). AI costs tokens and is a compliance grey area (P4) |
| Consideration | Find a tool that is safe and actually works on real repos | Compares diagram tools, reads READMEs, checks whether anything is uploaded | GitHub README, docs, `2_product_research.md` comparison | "Does it run locally? Does it break on central modules?" | Skeptical, cautious | Existing tools are stale, static, or SaaS (P5). Security approval is unclear **[ASSUMPTION]** (A5) |
| Conversion | Get a useful diagram on the first try | Installs fanri and runs `fanri ./account-repo`, no credentials, no `terraform init` | CLI, browser web UI | "It worked without cloning the module repos" | Relieved, curious | If the first diagram is unreadable or fails on an unresolved module, they leave immediately |
| Retention | Make it part of daily work: reviews, onboarding, learning | Hovers nodes for config and attribute docs, filters and searches, exports PNG / SVG / draw.io / Mermaid, uses the optional AI plug-in (off by default) through the AI tool already available, scripts batch export across accounts | CLI, web UI, exported images in PRs and wiki | "This is faster than reading the files" | Confident, in control | Inconsistent repo patterns (P1) still produce messy diagrams. 1,000 accounts need a repeatable, scriptable flow (P6) |
| Advocacy | Help the team and improve the tool | Shares diagrams in PRs and the wiki, recommends fanri to colleagues, files issues, contributes providers or mappings | PR reviews, team channels, GitHub issues and PRs | "The whole team should use this" | Proud, invested | Hard to contribute if provider logic is hard-coded. Internal approval needed before recommending a tool widely |

---

## 1.6 Key needs, ranked (input to scope)

| Rank | Need | Personas |
| --- | --- | --- |
| 1 | Get a diagram from a local folder with **no cloud credentials, no `terraform init`, and nothing sent off the machine by default** | A, B, C |
| 2 | Handle **unresolved central modules** without failing | A, C |
| 3 | Nested containers and automatic layout that stay readable | A, B, C |
| 4 | Hover or click to inspect resource config and attribute docs | A, B |
| 5 | Multi-cloud (AWS first, then Azure, then GCP), extensible later | A |
| 6 | Export and share | C |
| 7 | The **no-AI version is useful on its own**: diagram, placeholders, hover, and export all work with AI turned off | A, B, C |
| 8 | Optional AI plug-in that reuses the AI tool you already have (Cursor / Claude CLI, API key, or Ollama) with minimal tokens | A, B |
| 9 | Enrichment (state, drift, live cloud, cost, security) | C, A (later) |

**Insights**

1. **Privacy is a hard requirement for company code.** Enterprise users rule out any tool that uploads work repos. Public or personal repos are less strict, so cloud AI can be an opt-in choice there.
2. **The central-module problem is the sharpest pain.** It is also the one no existing tool solves (see doc 2).
3. **Users want answers that are the same every time.** AI is welcome as an optional helper, not as the source of truth. So we research two versions: the **simple no-AI version** (the base, usable on any repo with no approval needed) and the **no-AI version + AI plug-in**.
4. **Learning and daily work share one core need:** turn text into a graph and show details in context.
5. **At 1,000-account scale, a CLI and batch export matter**, not only an interactive UI.

---

## 1.7 Assumptions to validate & research plan

| ID | Assumption | How to validate |
| --- | --- | --- |
| A1 | Colleagues share the central-module pain (not only the author) | 5 short interviews with platform and app teams |
| A2 | Most account repos use git-sourced central modules, not a registry | Scan a sample of 20 repos and count module `source` types |
| A3 | Static HCL (without plan/state) is enough for a useful first diagram | Prototype on 5 real repos (sanitized), then rate usefulness from 1 to 5 |
| A4 | Users prefer a local CLI with a web UI over a VS Code extension | Ask in interviews |
| A5 | Security or compliance will allow a local tool with no network calls by default | Check with the security team early |
| A6 | Learners find hover docs from provider schemas valuable | Test with 2–3 junior engineers |
| A7 | A small AI plug-in that reuses the AI tool already available (Cursor at work, Claude outside) is useful, and a few narrow calls keep token use low | Spike with `claude -p` and `cursor-agent -p` on 3 repos. Measure tokens per question and rate usefulness from 1 to 5. Check the Cursor licence terms for CLI use |
| A8 | The simple no-AI version alone is useful enough for daily work, and AI is only an extra | Use the no-AI version on real repos for 2 weeks. Log which questions it answers alone and which still need AI |

**Interview script (short)**

1. Walk me through the last time you had to understand an unfamiliar Terraform repo.
2. What did you do when it called a module you didn't have?
3. What tools do you use today to see the architecture? What annoys you about them?
4. What must never leave your machine?
5. If a tool drew this for you, what would you check first?
