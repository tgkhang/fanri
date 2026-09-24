# Contributing to fanri

This file is the standard for branches, commits and pull requests. Keep to it so the history stays readable and the changelog can be generated from it later.

For setting up and running the project, see [HOW_TO_RUN.md](HOW_TO_RUN.md).

---

## 1. Workflow at a glance

```text
main ──●────────────────●──────────────●──▶   always releasable, protected
        \              /  squash merge
         ●──●──●──●───●                       feat/web-diagram-elk-layout
```

1. Pull the latest `main`.
2. Create a branch: `git switch -c feat/web-diagram-elk-layout`.
3. Commit in small steps with the commit format below.
4. Before pushing, run `npm run check` (lint + typecheck + test).
5. Open a PR. The template fills itself in, so complete every section.
6. **Squash merge** into `main`. The PR title becomes the commit on `main`, so it must follow the commit format too.
7. Delete the branch after merging.

---

## 2. Branch names

```text
<type>/<area>-<scope>-<short-summary>
```

- All **lowercase**, words separated by **`-`**, no spaces or `_`.
- **type**: the same list as commits (§3.2).
- **area**: which part of the repo (§3.3).
- **scope**: the feature or module inside that area.
- **short-summary**: 2–5 words saying what the branch does.
- Keep it under about 50 characters.

| ✅ Good | ❌ Bad | Why bad |
| --- | --- | --- |
| `feat/web-diagram-elk-layout` | `feature/new-layout` | type is not in the list, no area |
| `fix/server-graph-token-check` | `fix-bug` | no area/scope, doesn't say which bug |
| `refactor/core-ir-split-schema` | `Refactor/Core/IR` | uppercase, `/` inside the name |
| `docs/repo-contributing-guide` | `khang/test` | personal name, says nothing |
| `chore/repo-bump-vite` | `update_deps` | underscores, no type |

If there is an issue, you may add its number at the end: `fix/server-graph-token-check-42`.

---

## 3. Commit messages

Follows [Conventional Commits](https://www.conventionalcommits.org/).

```text
<type>(<scope>): <summary>

<body: optional, what and why>

<footer: optional, BREAKING CHANGE / Closes #id>
```

### 3.1 Rules

- **summary**: imperative mood ("add", not "added"/"adds"), lowercase first letter, no period at the end, ≤ 72 characters.
- **scope**: the area from §3.3, optionally with the feature: `server`, `web/diagram`, `core/ir`.
- **body**: explain *why*, not *how* (the diff shows how). Wrap at 72 characters.
- **One logical change per commit.** Don't mix formatting with a behaviour change.
- **Breaking change**: add `!` after the scope **and** a `BREAKING CHANGE:` footer.

### 3.2 Types

| Type | Use it for | In changelog |
| --- | --- | --- |
| `feat` | A new user-facing capability | ✅ Features |
| `fix` | A bug fix | ✅ Bug fixes |
| `perf` | Faster / less memory, no behaviour change | ✅ Performance |
| `refactor` | Code change that is neither a fix nor a feature | — |
| `test` | Add or fix tests only | — |
| `docs` | Documentation only | — |
| `style` | Formatting only (Biome, whitespace) | — |
| `build` | Build system, dependencies, tsup/vite config | — |
| `ci` | GitHub Actions and other CI config | — |
| `chore` | Other maintenance (gitignore, editor config, scripts) | — |
| `revert` | Reverts a previous commit | ✅ |

### 3.3 Areas (scopes)

| Area | Path |
| --- | --- |
| `server` | `apps/server` (BE: CLI + Express API) |
| `web` | `apps/web` (FE: React SPA) |
| `core` | `packages/core` (IR, loader, resolver, graph, plugin host) |
| `parser` | `packages/parser-hcl` |
| `plugin-aws` | `packages/plugin-aws` (and `plugin-azure`, `plugin-gcp` later) |
| `samples` | `samples/`, `fixtures/` |
| `docs` | `docs/` |
| `repo` | Root config: package.json, turbo, biome, tsconfig, gitignore, `.github` |

Add the feature after a `/` when it helps: `web/diagram`, `server/graph`, `core/resolver`.

### 3.4 Examples

```text
feat(web/diagram): add elk layout in a web worker
fix(server/graph): return 404 when node id is unknown
refactor(core/ir): split zod schema from exported types
test(core/resolver): cover git:: and s3:: module sources
build(repo): bump vite to 8.3
chore(repo): ignore samples/private
docs(docs): describe module resolution tiers
```

With body and footer:

```text
fix(server): reject requests with a non-local Host header

A page on another origin could reach the local server through DNS
rebinding. The Host header is now checked against 127.0.0.1/localhost
before any route runs.

Closes #12
```

Breaking change:

```text
feat(core/ir)!: rename GNode.parentId to GNode.containerId

BREAKING CHANGE: IR schemaVersion goes to 0.2. Plugins that set
parentId must use containerId.
```

---

## 4. Pull requests

### 4.1 Title

The PR title follows the commit format, because it becomes the squash commit on `main`:

```text
feat(web/diagram): add elk layout in a web worker
```

### 4.2 Description

[.github/pull_request_template.md](.github/pull_request_template.md) fills it in automatically. Every section is required. Write "N/A" when a section doesn't apply, but don't delete it.

| Section | What to write |
| --- | --- |
| **Summary** | 1–3 sentences: what this PR does, for someone who hasn't seen the code |
| **What changed** | Bullet list of the concrete changes |
| **Files impacted** | Main files/folders touched, and what changed in each |
| **Why** | The problem or requirement (link FR-x.x / NFR-x from `docs/5_*`, or the issue) and why this approach |
| **How to test** | A checklist the reviewer can follow step by step |
| **Screenshots** | Needed for any UI change (before/after) |
| **Checklist** | Self-review items, tick them all before asking for review |

### 4.3 Size and review

- Aim for **< 400 changed lines** (lock files excluded). Split bigger work into stacked PRs.
- A PR does **one thing**. Refactors go in their own PR ahead of the feature.
- Open as **Draft** until the checklist is done.
- The author merges after approval and green CI.

---

## 5. Code conventions (short)

- **TypeScript strict**. No `any` unless there's a comment explaining why.
- **Feature folders**: each BE/FE feature lives in its own folder with an `index.ts` that is its public API. Import from the folder, not from files deep inside another feature. See HOW_TO_RUN.md §6.
- **The IR is the contract.** Changing `packages/core/src/ir` means updating the schema version and the snapshot tests.
- **No network calls** in `core` or the parser (NFR-1).
- **Never commit** real infra, `.env`, state files or secrets. Real repos go in `samples/private/` (gitignored).
- Formatting and lint are Biome's job: `npm run format`.
