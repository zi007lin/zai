# ZAI Current State and Capabilities — Audit Report

**Spec:** issues/2026-04-15__research__zai-current-state-and-capabilities.scored.md
**Issue:** zi007lin/zai#40
**Audit date:** 2026-04-16
**Auditor:** ZiLin-Dev (Claude Opus 4.7) via `implw 40`

---

## Submission Flow

End-to-end path from a raw `spec.md` to a merged PR. Each step is labelled
**MANUAL** (operator action required) or **AUTO** (handled by infrastructure).

| # | Step | Mode | Where | Notes |
|---|------|------|-------|-------|
| 1 | Author writes a spec `.md` file | MANUAL | Local editor | Must follow `YYYY-MM-DD__<type>__<title>.md` naming |
| 2 | Drop / drag-upload spec into `demo.zai.htu.io/app` | MANUAL | Browser | UploadZone accepts a single `.md` file (`src/pages/AppPage.tsx:184–207`) |
| 3 | Client-side scoring runs `scoreSpec()` | AUTO | Browser | Pure-JS rubric eval, no network call (`src/lib/scoreSpec.ts`) |
| 4 | ScorePanel renders pass/fail + per-section status | AUTO | Browser | Two buttons: **Download scored spec** and **Run impl** (disabled unless `passed === true`) (`src/pages/AppPage.tsx:296–315`) |
| 5a | Download `.scored.md` (legacy path) | MANUAL | Browser | Operator then manually opens issue + runs `implw` locally |
| 5b | Click **Run impl** | MANUAL | Browser | One-click handoff to backend |
| 6 | `POST /api/issue` creates GitHub issue | AUTO | CF Worker (private) | Title `<type>: <slug>`, body = scored spec, label = `<spec_type>`, repo from `TARGET_REPO` constant (`AppPage.tsx:113–126`). Endpoint not in this repo — implemented in private CF Worker layer |
| 7 | `POST /api/impl` dispatches `repository_dispatch` | AUTO | CF Worker (private) | Payload: `{ issue_number, repo }`. Sets UI to `queued` ("PR will open in ~2 min") (`AppPage.tsx:129–140`) |
| 8 | GitHub Actions fires on `zilin_impl` event | AUTO | `streettt-private/.github/workflows/zilin-queue.yml:4–5` | Self-hosted runner labelled `[self-hosted, contabo, zilin, private]` |
| 9 | Runner pulls latest main, runs `claude -p "implw <N>"` | AUTO | Contabo VPS | Uses `ZZV_DISPATCH_TOKEN` as `GITHUB_TOKEN` (zilin-queue.yml:22–34) |
| 10 | `implw` skill executes Score gate + Re-run integrity check | AUTO | Claude session | `.claude/commands/implw.md` is the live path; `tools/zilin-bs/*` is reference-only |
| 11 | Gate 1 classifier runs | AUTO | Claude session | Trivial → proceed. Non-trivial → wait for `approved` comment or `needs-approval` label removal |
| 12 | daniel-silvers approves at Gate 1 (if non-trivial) | MANUAL | GitHub issue | Comment `approved` OR remove `needs-approval` label OR solo-operator session reply |
| 13 | Branch created, spec implemented, tests run, PR opened | AUTO | Claude session + runner | Branch prefix `zai/` for zai repo; `stt/` for streettt; reviewer = daniel-silvers |
| 14 | daniel-silvers reviews + merges PR | MANUAL | GitHub PR | **Enforceable dual-control gate** — solo author cannot self-merge |

**Operator touch-points:** Steps 1, 2, 5b, 12 (when non-trivial), 14. Everything
else is autonomous once secrets are in place.

---

## ZAI Scoring Rubric

**Source of truth:** `src/lib/scoreSpec.ts`

| Field | Value |
|-------|-------|
| `RUBRIC_VERSION` | `1.1.0` (`scoreSpec.ts:19`) |
| Detection | Filename prefix `YYYY-MM-DD__<spec_type>__<slug>.md` |
| Output schema | `ScoreResult` interface (`scoreSpec.ts:5–17`) |

**Schema fields:**

```ts
{
  rubric_version: string;        // "1.1.0"
  spec_type: SpecType;            // "feat" | "research" | "bug" | "chore" | "hotfix"
  score: string;                  // "N/M"
  required_count: number;         // M
  passed: boolean;
  evaluated_at: string;           // ISO 8601
  sections: Record<string, "PASS" | "FAIL" | "SKIP">;
  section_reasons: Record<string, string | null>;
  section_order: string[];
  section_labels: Record<string, string>;
  gates: string[];                // pre-deploy gates pulled from spec body
}
```

**Per-type required sections:**

| spec_type | Score | Required sections | Source |
|-----------|-------|-------------------|--------|
| `feat`    | 7/7   | intent, decision_tree, draft_of_thoughts, final_spec, game_theory, migration_summary, files_list | `scoreSpec.ts:245–253` |
| `research`| 6/6   | intent, research_questions, acceptance_criteria, report_format, migration_summary, files_list   | `scoreSpec.ts:255–262` |
| `bug`     | 5/5   | intent, reproduction_steps, fix, migration_summary, files_list                                  | `scoreSpec.ts:264–270` |
| `chore`   | 2/2   | intent, files_list                                                                              | `scoreSpec.ts:272–275` |
| `hotfix`  | 3/3   | intent, fix, files_list                                                                         | `scoreSpec.ts:277–281` |

**Notable section-check rules:**
- `intent`: 1–150 words, `## Intent` heading required
- `decision_tree`: must contain a markdown table OR the literal phrase "Trigger for change"
- `final_spec`: requires `## Acceptance Criteria` plus ≥3 checkboxes
- `game_theory`: requires "Who benefits", "Abuse vector", "Mitigation" subsections
- `migration_summary`: requires an "Open questions" row in a table with non-empty content

Scoring is fully **client-side and deterministic** — no LLM, no network. The
same `scoreSpec()` is reused server-side by the `implw` re-run integrity
check (Option B, CLAUDE.md Hard Rules step 6–9).

---

## GitHub Integration Status

**In-repo (`zi007lin/zai`):** None. `package.json` declares only `wrangler 3.80.0`
and `hono 4.6.0`; no `@octokit/*` or `gh` invocations exist in `src/`. The
worker (`src/worker/index.ts:26`) exposes only `/api/health`, `/api/env`, and
static asset serving.

**Out-of-repo (private CF Worker):** The browser calls `/api/issue` and
`/api/impl` (`AppPage.tsx:113–140`). Neither endpoint is implemented in this
repository — both live in a private Cloudflare Worker that holds the GitHub
token. From the client contract:

- `POST /api/issue` → returns `{ issue_number, issue_url }`
- `POST /api/impl`  → returns `{ status: "queued", … }`

**Auto-issue creation:** Yes (via the private endpoint). The label applied
matches `spec_type` (`feat`, `research`, `bug`, `chore`, `hotfix`). The
`needs-approval` label is **not yet applied automatically** — Gate 1 expects
it but the private worker does not add it. This is a known gap.

**Auto-PR opening:** No, not directly. ZAI only creates the issue and
dispatches `repository_dispatch zilin_impl`. The PR is opened later by
`implw` running on the contabo runner.

---

## ZiLin-BS Integration Status

**Workflow:** `streettt-private/.github/workflows/zilin-queue.yml`

```yaml
on:
  repository_dispatch:
    types: [zilin_impl]
runs-on: [self-hosted, contabo, zilin, private]
```

**Trigger model:** Fires on `repository_dispatch zilin_impl`, **not** on
issue creation, label add, or PR merge. The dispatch is sent by the private
`/api/impl` CF Worker (step 7 of Submission Flow).

**Required secrets:**
- `ZZV_DISPATCH_TOKEN` — used twice: as the actions checkout token and as
  `GITHUB_TOKEN` for the `gh` CLI inside the Claude session (zilin-queue.yml:22–25)
- `ANTHROPIC_API_KEY` — assumed present in the runner environment (consumed
  by `claude -p`); not declared inline in the workflow
- `STREETTT_PRIVATE_TOKEN` — referenced in CLAUDE.md but **not used by the
  current workflow**; likely reserved for future cross-repo writes from a
  zai-routed run that needs to push to `streettt-private`

**State of the TypeScript stubs:**
- `tools/zilin-bs/src/lib/gate1.ts` — reference implementation of the Gate 1
  classifier (queries comments + labels via `gh`)
- `tools/zilin-bs/src/commands/implw.ts` — placeholder wiring; reads issue
  number, repo, spec path; calls `gate1` then `impl`

**Per CLAUDE.md (lines 286–299):** these files are **not yet executed at
runtime**. The Markdown skill `.claude/commands/implw.md` is the live path.
The TypeScript surface exists so the Option A signature-verification
migration (parked spec `2026-04-13__feat__zai-score-signing-cf-worker.md`)
has a landing zone.

---

## daniel-silvers Approval Gate

**Two distinct gates exist:**

### Gate 1 — pre-impl approval
Source: `streettt-private/CLAUDE.md` "Gate 1 — spec approval classifier"
(lines 81–118) + "Gate 1 — solo operator path" (lines 122–148) + "Gate 1 —
Solo-operator approval via GitHub issue comment" (lines 252–289).

| Spec category | Behaviour |
|---------------|-----------|
| Trivial: `chore 2/2` or `hotfix 3/3`, no `gates[]` | Proceeds immediately, no approval needed |
| Non-trivial: `feat`, `research`, `bug`, or any spec with `gates[]` | Halts with `needs_input` until approval signal arrives |

**Approval signals (any one is sufficient):**
1. **Issue comment** equal to `approved` (case-insensitive, trimmed) authored
   by `zi007lin` or `daniel-silvers` (CLAUDE.md:255–268). This is the
   **primary channel for non-interactive runs** (`claude -p`, GitHub Actions
   dispatch, contabo runner) — without it, the agent would halt because it
   has no stdin.
2. **`needs-approval` label removal** by `zi007lin` or `daniel-silvers`
   (checked via issue event log).
3. **Solo-operator session reply** of `approved` typed by ZiLin in the
   active Claude session.

### Gate 2 — PR review at merge
Source: CLAUDE.md "Dual-PR Governance" (lines 161–166) + "Gate 1 — solo
operator path" (lines 135–138).

- `zi007lin` authors all PRs, never merges them.
- `daniel-silvers` reviews and merges (admin gate).
- This is the **enforceable dual-control gate**. The solo-operator Gate 1
  exception does **not** carry over — even when ZiLin self-approves at
  Gate 1, the resulting PR still requires review before merge.

**No ZAI-specific approval UI exists.** Approval is pure GitHub: issue
comments, labels, PR reviews. This keeps the audit trail in one place
(GitHub) instead of split across systems.

---

## Parked Items Status

**Directory inventory:** `zai/issues/parked/` contains exactly one file.

| Spec | Status | Notes |
|------|--------|-------|
| `2026-04-13__feat__zai-score-signing-cf-worker.md` | **PARKED** | Blocker: depends on a CF Worker scaffold that has not been built. Once shipped, supersedes the Option B re-run integrity check by replacing it with HMAC-SHA256 signature verification on the score block. Includes a 90-day key rotation plan with 30-day grace period |

**Specifically requested status checks:**

| Item | Status | Notes |
|------|--------|-------|
| ZAI rename to ZiSpec | **No spec found** — neither active nor parked in zai or streettt-private. The product name remains "ZAI" |
| zzv.io migration | **No spec found.** Production CF account is `zzv.io`; dev/staging is `htu.io` (per CLAUDE.md "Identity & Ownership"). No migration spec is in flight |
| History scrub | **No spec found** in zai or streettt-private. Not currently parked |
| Score-signing CF Worker | **PARKED** (see row above) |

**Other recent active/completed specs in `zai/issues/`** (for context):
- `2026-04-15__research__zai-current-state-and-capabilities.scored.md` — this audit
- `2026-04-16__bug__run-impl-dispatches-to-wrong-repo-v4.scored.md`
- `2026-04-16__feat__zai-multi-repo-runner-routing.scored.md`

---

## Blockers

Blockers to running the upstream `match-prediction-league` spec, ordered by
severity.

1. **`needs-approval` label is not auto-applied at issue creation.**
   Gate 1 reads "ZiLin-BS creates the issue, applies label `needs-approval`,
   and STOPS" — but the private `/api/issue` endpoint sets the label to the
   `spec_type` only. For non-trivial specs, the operator currently has to
   add `needs-approval` manually before they can rely on the
   label-removal approval channel. Workaround: the comment-based approval
   path works regardless. **Severity: MEDIUM** (workaround exists).

2. **`/api/issue` and `/api/impl` are not in this repo.** Both endpoints
   are implemented in a private CF Worker that is not version-controlled
   alongside the client. Any contract change requires touching two repos
   and risks drift. **Severity: MEDIUM** (works today, fragile tomorrow).

3. **Score-signing not yet shipped — Option B is still load-bearing.**
   Every `implw` run repeats `scoreSpec()` server-side to detect tampering.
   This depends on `~/dev/zai` being checked out on the runner with `tsx`
   available. If the runner image drifts (Node version, missing tsx, broken
   `scoreSpec.ts` import), every impl run will fail at step 5 of `implw`.
   The parked CF-Worker score-signing spec removes this dependency.
   **Severity: LOW** (currently works, single point of failure).

4. **`STREETTT_PRIVATE_TOKEN` is referenced but not wired.** CLAUDE.md
   mentions it as a required secret, but `zilin-queue.yml` does not pass
   it to the Claude session. If the match-prediction-league spec needs to
   write to `streettt-private` (e.g. updating `tools/zilin-bs/`), the run
   will fail with a permission error. **Severity: LOW** (only triggers on
   cross-repo writes).

5. **No retry / dead-letter on `repository_dispatch` failures.** If the
   `zilin_impl` event is sent while the runner is offline or the workflow
   YAML is broken, the dispatch silently disappears. UI shows "queued
   forever". **Severity: LOW** (rare, observable by polling the issue).

**Not blockers for match-prediction-league specifically:**
- Gate 1 will treat `feat: match-prediction-league` as non-trivial → an
  `approved` comment from daniel-silvers (or solo-operator override from
  zi007lin) is sufficient.
- Score gate will pass if the spec was scored at `dev.zai.htu.io/app`
  before submission.

---

## Recommendation

**Proceed with `match-prediction-league` impl.** None of the blockers above
are hard-blocks for that specific spec; all have workarounds.

Suggested operator workflow when running it:

1. Score the spec at `dev.zai.htu.io/app` and click **Run impl**.
2. Within ~10s, the new GitHub issue appears in `zi007lin/streettt`. Note
   the issue number.
3. Manually add the `needs-approval` label to the issue (workaround for
   blocker #1) — or skip this and proceed straight to step 4.
4. Reply `approved` as a comment on the issue from `zi007lin` (solo
   operator) or wait for `daniel-silvers` approval.
5. Within ~2 min, the contabo runner picks up the dispatch, runs
   `implw <N>`, opens a PR.
6. `daniel-silvers` reviews and merges. Done.

**Suggested follow-up specs (in priority order):**

1. **`chore: zai-add-needs-approval-label-on-issue-creation`** — small fix
   to the private `/api/issue` worker to apply both `<spec_type>` and
   `needs-approval` labels for non-trivial spec types. Closes blocker #1.
2. **`feat: zai-extract-cf-worker-to-zai-repo`** — bring the `/api/issue`
   and `/api/impl` worker code into `zi007lin/zai` (or
   `zi007lin/streettt-private`) so the client/worker contract is
   versioned together. Closes blocker #2.
3. **Unpark `2026-04-13__feat__zai-score-signing-cf-worker.md`** — once
   the worker scaffold lands as part of #2, the score-signing spec
   becomes implementable. Closes blocker #3.
4. **`chore: zilin-queue-add-streettt-private-token`** — add
   `STREETTT_PRIVATE_TOKEN` to the workflow secrets so cross-repo writes
   work. Closes blocker #4.

These four specs would move ZAI from "works for the solo operator who
knows the workarounds" to "works for any contributor who follows the
documented flow".

---

## Subject Migration Summary

| | |
|---|---|
| What | Audit of ZAI's submission flow, scoring rubric, GitHub/ZiLin-BS integration, and approval gates as of 2026-04-16 |
| Current state | All capabilities documented with file:line citations. Five blockers identified (1 medium, 4 low). Match-prediction-league impl is unblocked |
| Open questions | (1) Where exactly is the private CF Worker source for `/api/issue` and `/api/impl` checked in, if anywhere? (2) Is `STREETTT_PRIVATE_TOKEN` already set on the contabo runner secrets, just not exposed to this workflow? |
| Next actions | Run `implw` on the match-prediction-league spec. File the four follow-up specs listed in Recommendation |

---

## Files

```
issues/2026-04-15__research__zai-current-state-and-capabilities.md          (this report)
issues/2026-04-15__research__zai-current-state-and-capabilities.scored.md   (source spec)
```
