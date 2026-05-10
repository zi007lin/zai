# bug: ZAI "Run impl →" button dispatches with wrong target_repo, overriding spec header

**File:** `issues/2026-04-23__bug__zai-run-impl-stale-target-repo.md`
**Label:** `bug`
**Repo:** `zi007lin/zai`
**Branch:** `fix/zai-run-impl-target-repo`
**Reviewer:** daniel-silvers

---

## Intent

When the "Run impl →" button on ZAI's scored-spec output dispatches `repository_dispatch`, the payload `client_payload.target_repo` is being set incorrectly — either from a stale session value or from a UI default — and that incorrect value overrides the `**Repo:**` header parsed from the spec body. Result: specs route to the wrong repo and fail at issue-number resolution. This bug makes the dispatch authoritative on the spec header, ignoring or validating `client_payload.target_repo` against it.

---

## Repro

### Preconditions

- A scored spec is loaded in `zai.htu.io/app`
- The spec's `**Repo:**` header declares a target repo (e.g., `zi007lin/zai`)
- Either: (a) a previous dispatch in the same session used a different repo, or (b) the UI has a default `target_repo` that doesn't match the spec

### Steps

1. Score spec A whose `**Repo:**` header is `zi007lin/htu-foundation`. Click "Run impl →". Issue files, dispatch fires correctly against htu-foundation.
2. Immediately after, upload spec B whose `**Repo:**` header is `zi007lin/zai`. Score to PASS.
3. Click "Run impl →" for spec B.
4. Observe the ZiLin Queue Listener workflow run that results.

### Expected

Dispatch fires against `zi007lin/zai` per spec B's header. Runner resolves `target_repo = zi007lin/zai`, finds the new issue in zai, proceeds.

### Actual

Dispatch fires against `zi007lin/htu-foundation` (spec A's repo, not spec B's). Runner resolves `target_repo = zi007lin/htu-foundation`, looks for the new issue number there, does not find it, fails into `needs_input`:

```
Routing implw 66 for zi007lin/htu-foundation (legacy mode)
Issue #66 does not exist in zi007lin/htu-foundation. The highest issue number in that repo is 21.
```

Reference: workflow run `24866323457`, job `72803044381` on 2026-04-24, run #35 of `zilin_impl`. Scored spec was `2026-04-23__bug__dispatcher-error-messaging.md` (header `**Repo:** zi007lin/zai`). Dispatch routed to htu-foundation.

### Root cause

Hypothesis (to be confirmed during implementation):

- The ZAI web app's "Run impl →" button sends `client_payload.target_repo` on dispatch
- The value sent is either (a) held in session state from the previous dispatch, or (b) defaulted from a UI setting that doesn't refresh per spec
- The ZiLin Queue Listener workflow at the "Resolve target repo and mode" step treats `client_payload.target_repo` as authoritative when present, and only falls back to body parsing if that key is empty
- Net effect: the spec header's `**Repo:**` value is silently overridden when it disagrees with the payload

---

## Fix

Three layers.

### Layer 1 — ZAI frontend: derive target_repo from the currently-loaded spec only

In the ZAI scoring web app's dispatch handler:

- On every "Run impl →" click, re-parse `**Repo:**` from the currently-loaded scored spec
- Do not retain any `target_repo` value across spec loads
- Include the parsed value in `client_payload.target_repo` as the sole source; do not merge with any UI default or prior session value
- If the parse fails (no `**Repo:**` header or malformed), disable the button and surface the error inline ("Cannot dispatch: spec is missing **Repo:** header")

### Layer 2 — ZiLin Queue Listener: validate payload against spec body

In `.github/workflows/zilin-queue-listener.yml` at the "Resolve target repo and mode" step:

- If `client_payload.target_repo` is set AND the issue body contains a `**Repo:**` header, compare the two
- On agreement: proceed with that value; log `✓ target_repo agrees between payload and spec body`
- On disagreement: fail fast with a diagnostic block naming both values and asking the author to reconcile. Do not silently prefer one over the other.
- If only one source is populated, use that source and log which

### Layer 3 — telemetry

Log every dispatch's source-of-truth resolution ("payload-only", "body-only", "agreed", "disagreed-failed") as a GitHub Actions annotation. Later usage of this log will reveal whether the frontend fix (Layer 1) is sufficient or whether additional guardrails are needed.

---

## Acceptance Criteria

- [ ] ZAI web app re-parses `**Repo:**` from the currently-loaded spec on every "Run impl →" click, retaining no cross-spec state
- [ ] ZAI web app disables "Run impl →" with an inline error message if the currently-loaded spec has no parseable `**Repo:**` header
- [ ] `.github/workflows/zilin-queue-listener.yml` validates `client_payload.target_repo` against the issue body's `**Repo:**` header when both are present
- [ ] On disagreement, the workflow step fails fast with a diagnostic block showing both values and requesting reconciliation
- [ ] Every dispatch logs its resolution mode: `payload-only`, `body-only`, `agreed`, or `disagreed-failed`
- [ ] Regression test: score two specs back-to-back in the same ZAI session with different `**Repo:**` headers. Dispatch the second spec. Verify the runner routes to the second spec's repo, not the first's.

---

## Subject Migration Summary

| Topic | State |
|---|---|
| What this fixes | Stale or cross-spec `target_repo` values overriding the spec header during ZAI-initiated dispatch |
| Where | ZAI web app frontend dispatch handler + `.github/workflows/zilin-queue-listener.yml` |
| Scope | zai repo (frontend and workflow); no target-repo changes |
| Dependencies | Related to but independent of the dispatcher-error-messaging bug (issue #66 in zai). Both can ship in parallel; this bug's Layer 2 diagnostic will reuse #66's Layer 2 diagnostic block format. |
| Non-goals | Redesigning the dispatch payload schema; adding new payload fields; changing the issue-creation flow |
| Open questions | Whether the frontend actually sends `target_repo` in `client_payload` (confirm by inspecting run 24866323457's dispatch payload during implementation); whether the issue is frontend-side, workflow-side, or both |
| Current state | Spec drafted, not yet scored, not yet implemented |
| Next actions | Upload to zai.htu.io/app, score, file in zai, implw — and be careful that this spec itself dispatches correctly (it targets zai, same as the last spec that misrouted) |

---

## Files

```
.github/workflows/zilin-queue-listener.yml                    (modified; Layer 2 + Layer 3)
src/app/<dispatch-handler-path>                               (modified; Layer 1 — exact path confirmed at implementation)
issues/2026-04-23__bug__zai-run-impl-stale-target-repo.md     (this spec)
```

---

## Legal triggers

None.

Internal tooling dispatch routing. No end-user PII, no regulated data, no contract implications.

---

## ZAI Spec Score

- **Rubric version:** 1.3.1
- **Spec type:** bug
- **Evaluated at:** 2026-04-24T00:49:35.615Z
- **Score:** 7/7
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

_Source: 2026-04-23__bug__zai-run-impl-stale-target-repo.md_
