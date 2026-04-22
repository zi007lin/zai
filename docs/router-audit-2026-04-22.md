# Router Audit — 2026-04-22

Phase 0 output of `issues/2026-04-22__refactor__zai-router-dispatch-only.md`. Point-in-time inventory of the current ZAI router, the repos it routes to, and the secrets / env vars / runner labels each workflow depends on. This document is a snapshot; the state below can change after merge. To reproduce, check out each repo at the SHAs listed in the Audit snapshot table and re-grep.

## Scope

The refactor splits routing from execution. This audit captures:

1. Where `implw` is invoked today.
2. Which secrets the central executor depends on.
3. Which runner labels and env vars each invocation expects.
4. What needs to move (execution) and what stays (parse + dispatch).

## Current router — `zi007lin/zai`

| Field | Value |
|---|---|
| Workflow file | `.github/workflows/zilin-queue.yml` |
| Workflow `name:` | `ZiLin Queue Listener` |
| Trigger | `repository_dispatch` type `zilin_impl` |
| Runner labels | `[self-hosted, contabo, zilin, zai]` |
| Timeout | 60 minutes |
| Secrets | `ZZV_DISPATCH_TOKEN` |
| Runner-env dependencies | `HOME`, `PATH` (normalized in-workflow), `ROUTER_PATH` (set on runner, not in YAML) |
| External tooling | `@anthropic-ai/claude-code` CLI (auto-installed if missing) |
| Last commit touching file | `733f802` — `fix: defensive guard for claude CLI on ZAI runner + daily health check` (2026-04-18) |

> Spec note: `issues/2026-04-22__refactor__zai-router-dispatch-only.md` lists the router file as `.github/workflows/zilin_impl.yml`. The actual file on disk is `zilin-queue.yml`. Treated as a spec-side naming error; modifying the real file.

Today the router both parses the dispatch and executes the impl in the zai checkout:

```
cd "$ROUTER_PATH"
claude -p "implw $ISSUE_NUMBER --repo ${{ github.repository }}"
```

This is the exact path that surfaced the repo-mismatch failure captured in issue #57: the executor had no access to the target repo's code, tests, or deploy scripts.

## Target repos

### `zi007lin/streettt`

| Field | Value |
|---|---|
| `implw` invocations | `.github/workflows/zilin-dev.yml` (label-triggered, separate path from zai router) |
| Secrets used by that workflow | `ANTHROPIC_API_KEY`, `GITHUB_TOKEN` |
| Runner | `self-hosted` |
| Dormant `zilin-impl.yml` present? | No |

The streettt label-triggered path is independent of the zai router and is not affected by this refactor. It will coexist with the new dispatch-mode `zilin-impl.yml` once that's enabled.

### `zi007lin/htu.io`

| Field | Value |
|---|---|
| `implw` invocations | None |
| Existing workflows | `token-mint.yml` |
| Dormant `zilin-impl.yml` present? | No |

### `zi007lin/htu-foundation`

| Field | Value |
|---|---|
| `implw` invocations | None |
| Existing workflows | `.github/workflows/` directory does not exist |
| Dormant `zilin-impl.yml` present? | No |

### `zi007lin/nyqex`

Does not exist on GitHub at audit time (`gh repo view zi007lin/nyqex` returns a not-found). Skipped in Phase 1. If the repo is created later, `zilin-impl.yml` must be added before it can be cut over.

## Secrets inventory (union across all implw paths)

| Secret | Used by | Scope |
|---|---|---|
| `ZZV_DISPATCH_TOKEN` | zai `zilin-queue.yml` | repo-level in zai |
| `ANTHROPIC_API_KEY` | streettt `zilin-dev.yml` | repo-level in streettt |
| `GITHUB_TOKEN` | streettt `zilin-dev.yml` | ambient in every runner |

Post-refactor, each target repo's own `zilin-impl.yml` will resolve secrets from that repo — the zai router will no longer need cross-repo secret visibility.

## Runner labels in use

| Workflow | Labels |
|---|---|
| zai `zilin-queue.yml` | `self-hosted, contabo, zilin, zai` |
| streettt `zilin-dev.yml` | `self-hosted` |
| Proposed target-repo `zilin-impl.yml` (Phase 1) | `self-hosted, contabo, zilin` |

The new target-repo workflow label set drops `zai` (target-repo-specific, not zai-specific) and keeps `contabo, zilin` so GitHub continues to route jobs to the existing Contabo self-hosted runner(s).

## Env vars referenced on the runner (outside YAML)

- `ROUTER_PATH` — set on the Contabo runner, used by the legacy execute step (`cd "$ROUTER_PATH"`). Must remain set while the legacy path is alive. Not required for dispatch mode.
- `HOME`, `PATH` — normalized in-workflow; documented here because the `zilin-queue.yml` file contains an in-YAML fallback for cases where systemd units omit `Environment="HOME=..."`.

## Audit snapshot — reproducibility

To reproduce this audit: check out each repo at the SHA below and re-grep `.github/workflows/` for `implw`.

| Repo | Default branch | `main` HEAD @ audit time | Checked-out branch @ audit time | Checked-out HEAD |
|---|---|---|---|---|
| zi007lin/zai | main | `36ac1014ea` | main | `36ac1014ea` |
| zi007lin/streettt | main | `134f84b0b2` | `stt/match-prediction-league-spec` | `b314049efd` |
| zi007lin/htu.io | main | `0ee40e1e3f` | `stt/home-page-history-audit` | `0dd8a94e79` |
| zi007lin/htu-foundation | main | `c485815971` | `htu/park-score-signing-issue` | `67273e14fb` |

The non-`main` checkouts are unrelated in-progress work by the operator; they are recorded only so the audit is reproducible, not because they contain implw-relevant changes. The `main` HEAD column is the canonical audit state.

## What this refactor changes

- **Moves out of zai:** execution (claude CLI install, checkout, `claude -p "implw ..."`).
- **Stays in zai:** payload parse, target-repo validation against allow-list, dispatch of `repository_dispatch` to the target.
- **New per-target-repo surface:** a dormant `.github/workflows/zilin-impl.yml` that listens on `repository_dispatch` type `zilin-impl` (hyphen) and is gated by `vars.ZILIN_IMPL_ENABLED == 'true'`. Dormant by default; activation is Phase 3+.
