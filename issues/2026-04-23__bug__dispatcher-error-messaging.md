# bug: ZiLin Queue Listener — "Resolve target repo and mode" step gives no diagnostic surface on failure

**File:** `issues/2026-04-23__bug__dispatcher-error-messaging.md`
**Label:** `bug`
**Repo:** `zi007lin/zai`
**Branch:** `fix/dispatcher-error-messaging`
**Reviewer:** daniel-silvers

---

## Intent

When the "Resolve target repo and mode" step in `.github/workflows/zilin-queue-listener.yml` fails to extract `target_repo` from `client_payload` or the spec body, the only output is `Error: could not resolve target_repo from payload or spec body`. The author gets no signal as to which label the parser expected, what it actually found, or how to correct the spec header. This bug replaces the silent error with a diagnostic block that names the expected regex, shows the first 10 lines of the issue body, and lists the payload keys present. Result: the next author who hits this failure self-corrects in one minute instead of reverse-engineering the workflow file.

---

## Repro

### Preconditions

- ZiLin Queue Listener workflow is active in `zi007lin/zai`
- An issue is filed with a spec body that uses a header label other than `**Repo:**` (e.g., `**Canonical repo:**`, `**Target:**`, `**For:**`)
- Dispatch fires via `repository_dispatch` without `client_payload.target_repo` set (typical for issue-triggered runs)

### Steps

1. File an issue in `zi007lin/zai` with a spec body whose first few lines use `**Canonical repo:** zi007lin/htu-foundation` instead of `**Repo:** zi007lin/htu-foundation`
2. Trigger the ZiLin Queue Listener workflow against that issue
3. Wait for the workflow run to reach step "Resolve target repo and mode"

### Expected

The step either:
- Resolves `target_repo` correctly by accepting both `**Repo:**` and alias labels, OR
- Fails with a diagnostic message naming the regex tried, the body slice inspected, and suggested corrections

### Actual

The step fails with a single line:

```
Error: could not resolve target_repo from payload or spec body
```

No context about:
- Which regex was applied
- What label was searched for
- What the first lines of the issue body actually contain
- Which `client_payload` keys were present
- How the author can correct the spec

Reference: workflow run `24863811196`, job `72795293850` on 2026-04-23, run #33 of `zilin_impl`.

### Root cause

In `.github/workflows/zilin-queue-listener.yml`, the "Resolve target repo and mode" step uses a single `grep -oP` or `sed` extraction against the issue body looking for the literal string `**Repo:**` followed by a repo slug. When the regex doesn't match and `client_payload.target_repo` is empty, the step exits 1 with a single `echo` and no surrounding context. The parser's expectations are implicit — readable only by reading the workflow source.

---

## Fix

Three layers. Each layer is independently valuable; the stack together gives a good diagnostic surface without over-engineering.

### Layer 1 — accept alias labels

Extend the regex to accept the most common synonyms so typo-adjacent spec headers resolve cleanly:

Accepted labels (case-insensitive, markdown-bold form):

- `**Repo:**` (canonical)
- `**Target repo:**`
- `**Target:**`
- `**Canonical repo:**`
- `**For repo:**`

If any match, use the first one found. If multiple match, prefer `**Repo:**` over aliases; log which alias was used as a YELLOW warning so authors learn the canonical form.

### Layer 2 — diagnostic block on failure

When no label resolves and `client_payload.target_repo` is also empty, emit a structured diagnostic block to the step output before exiting 1:

```
❌ RESOLVE target_repo FAILED

Tried:
  client_payload.target_repo       → empty
  regex on issue body              → no match

Expected one of these header labels in the issue body:
  **Repo:** <owner>/<name>          (canonical)
  **Target repo:** <owner>/<name>
  **Target:** <owner>/<name>
  **Canonical repo:** <owner>/<name>
  **For repo:** <owner>/<name>

Issue body — first 10 lines:
  1: # feat: session log convention — per-repo Claude Code continuity...
  2:
  3: **File:** `issues/2026-04-23__feat__session-log-convention.md`
  4: **Label:** `feat`
  5: **Canonical repo:** `zi007lin/htu-foundation`
  6: **Rollout targets:** all active HTU repos (enumerated in Migration Plan)
  ...

client_payload keys present:
  issue_number, sender, action

Next step:
  Add or fix the header label, then re-dispatch. See
  docs/PROCEDURES/spec-header-conventions.md for canonical form.
```

### Layer 3 — link to docs

Create `docs/PROCEDURES/spec-header-conventions.md` in `zi007lin/zai` documenting the required and accepted header labels, the parsing order, and the alias-to-canonical mapping. The diagnostic block's final line points at this doc. No separate spec needed for the doc — it's part of this fix.

---

## Acceptance Criteria

- [ ] `.github/workflows/zilin-queue-listener.yml` "Resolve target repo and mode" step accepts the five label variants listed in Layer 1
- [ ] On successful match of an alias (not canonical), step logs `::warning::` naming which alias matched and recommending `**Repo:**`
- [ ] On failure to resolve, step emits the diagnostic block in Layer 2 with: regex tried, first 10 lines of issue body, `client_payload` keys present, and doc link
- [ ] `docs/PROCEDURES/spec-header-conventions.md` exists in `zi007lin/zai` listing canonical label, accepted aliases, and parsing order
- [ ] Diagnostic block renders correctly in GitHub Actions log view (no broken markdown, no truncation at 80 chars)
- [ ] Regression test: re-run against the synthetic spec from the Repro section. With Layer 1, should resolve `zi007lin/htu-foundation` successfully via the `**Canonical repo:**` alias, with a YELLOW warning logged.

---

## Subject Migration Summary

| Topic | State |
|---|---|
| What this fixes | The silent failure of "Resolve target repo and mode" by adding alias acceptance and a diagnostic block |
| Where | `.github/workflows/zilin-queue-listener.yml` + new `docs/PROCEDURES/spec-header-conventions.md` |
| Scope | Affects zai repo only; no changes to target-repo runners |
| Dependencies | None; workflow is self-contained |
| Non-goals | Rewriting the entire dispatcher; adding new label categories beyond repo resolution; fixing similar silent failures in other workflow steps (those are separate specs if they exist) |
| Open questions | Whether to fail-hard or fail-soft on alias usage — currently soft (warn-and-proceed); could be tightened to hard after a deprecation window |
| Current state | Spec drafted, not yet scored, not yet implemented |
| Next actions | Upload to zai.htu.io/app, score, land on zai repo, implement via implw |

---

## Files

```
.github/workflows/zilin-queue-listener.yml                    (modified)
docs/PROCEDURES/spec-header-conventions.md                    (new)
issues/2026-04-23__bug__dispatcher-error-messaging.md         (this spec)
```

---

## Legal triggers

None.

Workflow-internal error messaging affects only internal tooling developer experience. No end-user PII, no regulated data, no contract clauses touched by this fix.

---

## ZAI Spec Score

- **Rubric version:** 1.3.1
- **Spec type:** bug
- **Evaluated at:** 2026-04-24T00:45:09.179Z
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

_Source: 2026-04-23__bug__dispatcher-error-messaging.md_
