# BUG: CI implw hangs to timeout — missing --dangerously-skip-permissions

## Intent

Action-dispatched implw in this repo hangs for the full timeout and dies with exit 124, producing no PR. The headless claude invocation in implw.yml runs without --dangerously-skip-permissions, and project-level bypassPermissions is not honored for claude -p in CI, so the agent falls back to ask-mode, blocks on an unanswerable permission prompt (stdin is /dev/null), and times out. Identified by a portfolio-wide audit after the same defect was fixed in streettt.com (#969/#970). Restore working autonomous execution by passing the flag explicitly.

## Repro

### Preconditions
- Self-hosted runner contabo-zilin, claude CLI on PATH, subscription auth live (claude -p "ping" returns pong).
- This repo carries .github/workflows/implw.yml and a scored issue dispatchable through it.

### Steps
1. Dispatch implw.yml for a scored issue in this repo.
2. Observe the "Run claude" step.

### Expected
implw reads the spec, edits files, opens a PR against main, exits 0.

### Actual
Step prints `claude auth mode: subscription (...)` then produces no further output until `timeout` sends SIGTERM; step exits 124; no branch, no PR.

### Root cause
The implw.yml step invokes `claude -p "/implw <spec>" < /dev/null` with no permission-mode flag. Project-committed `defaultMode: bypassPermissions` in .claude/settings.json is not honored for headless `claude -p` in CI (a repo cannot self-grant bypass). The agent therefore runs in ask-mode, hits the first gated tool, and waits for an approval that can never arrive through `/dev/null`. The fix was verified in streettt.com: adding `--dangerously-skip-permissions` made an Action-dispatched implw complete and open a PR (#972), confirming the flag is the operative remedy.

## Fix

### Layer 1 — pass the flag in CI
Add `--dangerously-skip-permissions` to the `claude -p` invocation in `.github/workflows/implw.yml`. Combined with the global `skipDangerousModePermissionPrompt: true`, the run proceeds silently and non-interactively.

### Layer 2 — correct stale permission paths (conditional)
If this repo's `.claude/settings.json` carries `Write`/`Edit`/`Read` globs pointing at `/home/zilin/actions-runner-private/_work/**`, migrate them to `/home/zilin/actions-runner/_work/**`. Portfolio audit found no such globs outside streettt.com; re-verify in this repo and treat as N/A if absent.

## Acceptance Criteria

- [ ] The `.github/workflows/implw.yml` `claude -p` invocation includes `--dangerously-skip-permissions`.
- [ ] An Action-dispatched implw on a scored issue in this repo completes and opens a PR (exit 0), no exit-124 timeout.
- [ ] `.claude/settings.json` contains no `actions-runner-private` paths (Layer 2 applied if any were present).
- [ ] No regression to the manual hand-run path.

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| implw CI invocation | bare `claude -p` (ask-mode, hangs) | `--dangerously-skip-permissions` (non-interactive) |
| Autonomous implw via Action | broken (exit 124) | functional (opens PR) |
| settings Write/Edit paths | possibly `actions-runner-private/_work` | `actions-runner/_work` if present, else unchanged |
| Open questions | Does this repo's settings.json carry the stale glob? | Re-verify during fix; audit suggests no |

## Files

```
.github/workflows/implw.yml   # MODIFIED — add --dangerously-skip-permissions to claude -p
.claude/settings.json         # MODIFIED (conditional) — actions-runner-private → actions-runner if present
```

## Legal triggers

None. CI invocation and local agent permission configuration only; no contract, license, PHI, PAN, or data-residency surface.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Edit implw.yml (+ settings if stale) | None | 8 min |
| PR + review | None | 4 min |
| Dispatch verification implw | None | 3 min |
| **Total** | — | 15 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Edits + PR | None | 12 min |
| Verification implw run | Action run | 5 min |
| **Total** | — | 17 min |

### Assumptions

- The only permission-mode gap is the missing CLI flag; no additional Claude Code config blocks headless execution.
- The active runner path remains /home/zilin/actions-runner/_work.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---|---|---|
| Edits + PR | 12 min | TBD | TBD |
| **Total** | 12 min | TBD | TBD |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** bug
- **Evaluated at:** 2026-05-27T08:09:22.517Z
- **Score:** 8/8
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| repro | PASS |
| fix | PASS |
| acceptance_criteria | PASS |
| migration_summary | PASS |
| files | PASS |
| legal_triggers | PASS |
| work_estimate | PASS |

_Source: 2026-05-09__bug__inline.md_

## Provenance (auto-materialized)

- Acquisition path: inline-scored (Path B) via solo-operator implw on local spec
- Materialized at: 2026-05-27 by implw flow
- Integrity re-score: PASS (8/8, rubric 1.5.0) — matches embedded score block
