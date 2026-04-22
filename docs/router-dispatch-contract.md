# Router Dispatch Contract

Canonical reference for the `repository_dispatch` payload emitted by the ZAI router, the allow-list that gates it, and the rollback procedure. Drafted from `issues/2026-04-22__refactor__zai-router-dispatch-only.md` sections **Dispatch payload contract**, **Allow-list enforcement**, and **Rollback procedure**. Any change to the payload shape or the allow-list must land here and in the router workflow together.

## Payload contract

When the ZAI router is in `dispatch` mode for a given target repo, it fires `repository_dispatch` to that repo with:

```json
{
  "event_type": "zilin-impl",
  "client_payload": {
    "issue_number": 123,
    "target_repo": "zi007lin/streettt",
    "spec_path": "issues/YYYY-MM-DD__type__title.scored.md",
    "spec_type": "feat|bug|spec|chore|refactor|research|ux|brand",
    "needs_approval": true,
    "source_zai_run_url": "https://github.com/zi007lin/zai/actions/runs/..."
  }
}
```

### Field notes

| Field | Type | Source | Notes |
|---|---|---|---|
| `issue_number` | integer | zai client_payload on inbound dispatch | Required; the issue on `zi007lin/zai` whose body contains the scored spec |
| `target_repo` | string `org/repo` | parsed from `**Repo:**` in the spec body, or passed through from inbound payload | Must match the allow-list — see below |
| `spec_path` | string | relative path inside target repo | E.g. `issues/2026-04-22__refactor__zai-router-dispatch-only.scored.md` |
| `spec_type` | string enum | parsed from spec filename `YYYY-MM-DD__TYPE__title` | Drives downstream commit prefix + version bump |
| `needs_approval` | boolean | inbound payload or computed per Gate 1 classifier | Target repo workflow may re-apply the approval gate |
| `source_zai_run_url` | string URL | built in zai at dispatch time | Audit breadcrumb; points back to the zai router run |

Event type is **`zilin-impl`** (hyphen), not `zilin_impl` (underscore). Underscore remains reserved for the inbound event the zai router itself listens on; hyphen is the outbound event type the router fires to target repos. This keeps the two sides distinguishable in runner logs and payload captures.

## Allow-list

The router refuses to dispatch to any repo outside this list. Prevents a malicious or malformed spec from targeting an arbitrary org/repo.

```
zi007lin/streettt
zi007lin/htu.io
zi007lin/nyqex
zi007lin/htu-foundation
zi007lin/zai
```

The allow-list lives inline in the router workflow (`.github/workflows/zilin-queue.yml`) as a `case` statement. Editing it is governed by the standard dual-PR process on `zi007lin/zai` — `daniel-silvers` is the only approver. No repo-variable indirection: the source of truth is the committed YAML.

## Mode resolution

Per-repo via repo variable `ZAI_DISPATCH_MODE_<REPO_SLUG>`:

| Variable | Effect |
|---|---|
| `ZAI_DISPATCH_MODE_STREETTT=dispatch` | streettt → fired via `repository_dispatch` |
| `ZAI_DISPATCH_MODE_STREETTT=legacy` or unset | streettt → executed in-place by zai router (current behavior) |
| Same pattern for `HTU_IO`, `HTU_FOUNDATION`, `NYQEX`, `ZAI` | … |

Slug rules: repository name lowercased, `.` and `-` rewritten to `_`, then uppercased. Examples:

| Repo | Slug | Variable |
|---|---|---|
| `zi007lin/streettt` | `STREETTT` | `ZAI_DISPATCH_MODE_STREETTT` |
| `zi007lin/htu.io` | `HTU_IO` | `ZAI_DISPATCH_MODE_HTU_IO` |
| `zi007lin/htu-foundation` | `HTU_FOUNDATION` | `ZAI_DISPATCH_MODE_HTU_FOUNDATION` |
| `zi007lin/nyqex` | `NYQEX` | `ZAI_DISPATCH_MODE_NYQEX` |
| `zi007lin/zai` | `ZAI` | `ZAI_DISPATCH_MODE_ZAI` |

Default (variable unset or any value other than `dispatch`): `legacy`.

## Target-repo workflow gate

Each target repo has `.github/workflows/zilin-impl.yml` gated by `vars.ZILIN_IMPL_ENABLED == 'true'`. When unset or `false` the job is a no-op: GitHub still delivers the dispatch, but the `if:` evaluates falsy and nothing runs.

This means enabling dispatch mode is a **two-variable flip** per target repo:

1. Set `ZAI_DISPATCH_MODE_<SLUG>=dispatch` on `zi007lin/zai` — zai starts firing.
2. Set `ZILIN_IMPL_ENABLED=true` on the target repo — target starts executing.

Either flip alone is safe: (1) without (2) delivers dispatches that no-op at the target. (2) without (1) delivers nothing because zai never dispatches.

## Rollback procedure

| Scope | Action | Data loss risk |
|---|---|---|
| Single repo, too hot | Set `ZAI_DISPATCH_MODE_<SLUG>=legacy` on zai | None — zai falls back to in-place execute |
| All repos | Set all `ZAI_DISPATCH_MODE_*=legacy` on zai | None |
| Full revert of the refactor | `git revert` the zai merge commit back to pre-refactor; dormant `zilin-impl.yml` files in target repos stay as-is (no-op) | None |
| Emergency — dispatch delivered but target misbehaving | Set `ZILIN_IMPL_ENABLED=false` on the target repo; run `implw` from local WSL until fixed | None |

### Pre-refactor anchor

Pre-refactor SHA on `zi007lin/zai` main: **`36ac1014ea2dd80ad2c456b6ec30770929aa3383`**. Fast revert:

```
git revert -m 1 <merge-commit-of-this-PR>
```

or, if merged directly (non-merge commit):

```
git revert <commit-sha>
```

No database changes, no data migrations, no force-pushes — every rollback step is a config flip or a single revert.

## Phase status at time of writing

- **Phase 0** — audit doc (`docs/router-audit-2026-04-22.md`): landed in this PR.
- **Phase 1** — dormant `zilin-impl.yml` in each target repo: separate PRs, not merged in this PR.
- **Phase 2** — dual-mode router (this file + `.github/workflows/zilin-queue.yml` edit): landed in this PR.
- **Phase 3+** — cutover (var flips, canary, per-repo soak): **out of scope for this PR**. No `ZAI_DISPATCH_MODE_*` or `ZILIN_IMPL_ENABLED` variables are being set anywhere by this change.

## What this contract does not cover

- Signing or verification of dispatch events (open question in the spec's Subject Migration Summary). Currently the target-repo workflow trusts any `repository_dispatch` of type `zilin-impl`; only accounts with `repository_dispatch` write permission on the target can send those. If we need to reject spoofed dispatches from a compromised but scoped token, add a signed payload field and verify in the target workflow. Tracked as a follow-up, not a blocker.
- Durable audit log of every dispatch. Today the `source_zai_run_url` breadcrumb is the only record; if we want a queryable log we'd emit to an external sink. Tracked as a follow-up.
- Shared-tooling location for Claude Code CLI install once each target repo has its own workflow. For Phase 1 the dormant workflows inherit the runner's ambient install; once Phase 3+ cutovers begin, we may factor the install step into a composite action. Tracked as a follow-up.
