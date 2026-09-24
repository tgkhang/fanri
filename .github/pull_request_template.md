<!--
PR title must follow the commit format:  type(scope): summary
e.g.  feat(web/diagram): add elk layout in a web worker
See CONTRIBUTING.md §4.
-->

## Summary

<!-- 1–3 sentences: what this PR does, written for someone who hasn't seen the code. -->

## What changed

<!-- Concrete changes, one per bullet. -->
-
-

## Files impacted

<!-- Main files/folders touched and what changed in each. Skip lock files and generated files. -->

| File / folder | Change |
| --- | --- |
| `apps/...` | |
| `packages/...` | |

## Why

<!-- The problem or requirement and why this approach. Link FR-x.x / NFR-x from docs/5_ssr_app_feature.md, or an issue. -->

Closes #

## How to test

<!-- Steps a reviewer can follow. Tick them as you verify. -->
- [ ] `npm install`
- [ ] `npm run check` passes (lint + typecheck + test)
- [ ] `npm run dev`, open the printed URL, and ...
- [ ] Tried against `samples/simple-web-app` and `samples/landing-zone/envs/prod`
- [ ]

## Screenshots

<!-- Required for UI changes: before / after. Otherwise N/A. -->

## Checklist

- [ ] Branch name follows `type/area-scope-summary`
- [ ] Commits follow `type(scope): summary`
- [ ] Self-reviewed the diff
- [ ] Tests added or updated (or explained why not)
- [ ] Docs updated (`docs/`, `HOW_TO_RUN.md`, README) if behaviour or setup changed
- [ ] No secrets, real infra, `.env` or state files committed
- [ ] No new outbound network call in `core` / parser (NFR-1)
- [ ] IR schema change? Bumped `IR_SCHEMA_VERSION` and updated snapshots
