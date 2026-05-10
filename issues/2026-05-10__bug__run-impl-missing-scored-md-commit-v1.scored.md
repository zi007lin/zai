# BUG: ZAI Run Impl creates issue without committing .scored.md to repo

## Intent

The "Run Impl" button at `zai.htu.io/app` files the GitHub issue with
the scored markdown in the body, but does NOT commit the corresponding
`issues/<filename>.scored.md` file to the target repo. Result: the
audit-trail invariant the methodology depends on (`issues/` directory
contains every scored spec as a committed artifact) is broken for every
issue filed via Run Impl. Observed on `zi007lin/zai#53`, `#55`, `#56` —
all show issue body present but no corresponding committed file. By
contrast, the MCP `score_and_file` tool has the same gap intentionally
(dual-archival via separate PR), but the Run Impl button advertises
itself as a one-shot pipeline and so the missing commit is a defect, not
a design choice. Fix adds the commit step before issue creation, atomic
on commit success.

## Repro

### Preconditions

- A markdown spec that passes ZAI scoring at `zai.htu.io/app`
- A target repo where the user has `issues:write` AND `contents:write` permissions
- Run Impl button visible (enabled because score is PASS)

### Steps

1. Upload a passing spec to `zai.htu.io/app`
2. Verify the score-result panel shows PASS with green check on every rubric item
3. Click "Run Impl"
4. Wait for the success toast / issue link to appear
5. Open the target repo on GitHub
6. Navigate to `issues/` directory in the repo's file tree

### Expected

A new commit on the default branch (typically `main`) authored by the
ZAI service identity, adding `issues/<spec-filename>.scored.md` with
body identical to the issue body. The file lands BEFORE or atomically
with the issue creation.

### Actual

Issue is created with the scored markdown in the body. NO commit appears
on the default branch. The `issues/` directory does not contain the
new `.scored.md` file. Confirmed on `zi007lin/zai#53` (filed
2026-04-something), `#55`, `#56` — all three issues exist with bodies,
none have a corresponding file in `issues/`.

### Root cause

The Run Impl handler invokes the GitHub Issues API
(`POST /repos/{owner}/{repo}/issues`) but does not invoke the Contents
API (`PUT /repos/{owner}/{repo}/contents/{path}`) before or after.
The commit step appears to have been omitted at handler-write time, or
removed during a refactor — empirically it is not present in the live
2026-05-10 deployed worker behavior. Confirm in implw discovery by
inspecting whichever file in `zi007lin/zai` houses the Run Impl
endpoint handler.

## Fix

### Layer 1 — Add the commit step before issue create

Wrap the existing issue-create logic with a preceding commit:

```typescript
// Pseudo-code; actual file path resolved in implw discovery.
async function runImpl(specMd: string, specType: string, targetRepo: string, filename: string) {
  // 1. Commit the .scored.md file to the target repo first.
  const commitResult = await octokit.repos.createOrUpdateFileContents({
    owner, repo,
    path: `issues/${filename}.scored.md`,
    message: `chore: archive scored spec for ${filename}`,
    content: btoa(specMd), // base64
    branch: 'main',
  });
  if (!commitResult.data.commit) {
    throw new Error('commit_failed_before_issue_create');
  }

  // 2. Create the issue, body = same scored markdown.
  const issueResult = await octokit.issues.create({
    owner, repo,
    title: extractTitle(specMd),
    body: specMd,
    labels: [specType],
  });

  return { issue: issueResult.data, commit: commitResult.data };
}
```

Atomicity rule: commit MUST succeed before issue create runs. If commit
fails (auth, rate limit, conflict), the function throws and no issue is
created. This is a regression-safe choice — the worse failure mode is
"nothing filed" which the user retries; the current bug's failure mode
is "issue filed but file missing" which silently corrupts the audit
invariant.

### Layer 2 — Retroactive fix for issues #53, #55, #56

These three issues are already filed without their files. Repair via a
separate one-shot commit (not part of this BUG's PR — track in a
follow-up CHORE). The commit adds the three missing `.scored.md` files
to `zi007lin/zai/issues/` with bodies copied verbatim from each issue.

### Layer 3 — Tail observability

Log the commit step's success/failure at a level distinct from issue
creation, so future regressions are visible in `wrangler tail` output:

```
[runImpl] committed issues/<filename>.scored.md at sha=<sha>
[runImpl] created issue #<n> in <owner>/<repo>
```

Enables `tail | grep runImpl` to immediately show whether the bug
recurs.

## Acceptance Criteria

- [ ] After clicking "Run Impl" on any passing spec, a new commit
      appears on the target repo's default branch within 5 seconds of
      the issue creation
- [ ] The committed file path is `issues/<spec-filename>.scored.md`
- [ ] The committed file body matches the issue body byte-for-byte
      (both contain the canonical `.scored.md` with the appended ZAI
      score block)
- [ ] If the Contents API call fails (4xx, 5xx, or rate limit), no
      issue is created — the function throws and the UI shows an error
      toast with the specific failure reason
- [ ] If the user-supplied OAuth token lacks `contents:write` on the
      target repo, the failure message instructs them to re-auth with
      the missing scope (rather than producing a silent partial result)
- [ ] `wrangler tail` (or equivalent service log) shows two distinct
      log lines per Run Impl invocation: one for the commit step, one
      for the issue create step
- [ ] Existing successful Run Impl behavior is preserved — issue is
      still created with the full scored body
- [ ] Unit tests cover: happy path (both succeed), commit fails (no
      issue created), issue create fails after successful commit (file
      orphaned, surfaced as warning, no rollback attempted because git
      history is append-only), unknown spec type, missing scope

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| Run Impl click → repo state | Issue created; no file commit | Issue created + `issues/<filename>.scored.md` committed |
| Atomicity guarantee | None | Commit MUST succeed before issue create runs |
| Audit invariant | Broken silently | Enforced at handler level |
| GitHub API surface used | Issues API only | Issues API + Contents API |
| Required OAuth scopes | `issues:write` | `issues:write` + `contents:write` |
| Failure mode | Issue created without file (silent corruption) | Either both succeed, or neither (commit fails first → throw) |
| Tail observability | One log line per click | Two log lines (commit + issue) per click |
| Retroactive scope | n/a | #53, #55, #56 — handled in follow-up CHORE, not this BUG |
| Open questions | n/a | Whether the existing GitHub OAuth app's granted scopes already include `contents:write`, or whether re-auth is needed; resolved in implw discovery |

## Files

```
zi007lin/zai/<run-impl-handler-path>                                            (UPDATED — add commit step, atomicity guard, tail logging)
zi007lin/zai/<run-impl-test-path>                                               (UPDATED or NEW — 5+ test cases for commit/issue interaction)
zi007lin/zai/README.md                                                          (UPDATED — document the new contents:write requirement)
zi007lin/zai/CLAUDE.md                                                          (UPDATED — deploy changelog line, post-deploy)
issues/2026-05-10__bug__run-impl-missing-scored-md-commit-v1.scored.md          (NEW, audit artifact)
```

The `<run-impl-handler-path>` and `<run-impl-test-path>` placeholders
resolve in implw discovery — the exact file is not known from outside
the repo. Likely candidates: `src/api/runImpl.ts`,
`src/handlers/run-impl.ts`, or `src/routes/run-impl.tsx` depending on
the framework structure.

## Legal triggers

None. Internal tool defect repair. No PII handled, no third-party
content, no contract clauses, no license terms beyond existing
Cloudflare Workers TOS already in force on the deployed `zai.htu.io`
worker. The added `contents:write` scope expands what the OAuth token
can do on the user's behalf, but that's the user's repo — they're
authorizing an action on their own resources.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Spec score iteration | None | 15 min |
| File via score_and_file MCP call | None | 1 min |
| PR review (handler + tests) | implw completes | 20 min |
| Manual smoke: file a throwaway passing spec via Run Impl, verify both commit + issue land | Deploy | 5 min |
| Triage retroactive fix scope for #53/#55/#56 (separate CHORE) | After this BUG merges | 5 min |
| Total | | 46 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Spec score | None | 3 min |
| File issue + implw start | Score pass | 2 min |
| ZiLin-Dev autonomous execution | implw start | 60 min |
| CI green | PR open | 8 min |
| Approver review + merge | CI green | 25 min |
| Deploy via `npx wrangler deploy` from `zai/` | Merge | 5 min |
| Manual smoke | Deploy | 5 min |
| Total | | 1 h 48 min |

### Assumptions

- Run Impl handler lives in `zi007lin/zai`; exact file path resolves in implw discovery
- `zai.htu.io/app` is deployed via `npx wrangler deploy` from the local repo (matches the zzv-skills pattern observed this session)
- The existing GitHub OAuth app for ZAI Run Impl either already has `contents:write` scope (no user-facing re-auth needed) or can have it added (acceptable user-facing re-auth flow)
- GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`) is the correct primitive — does not require a separate blob/tree/commit/ref dance
- The retroactive fix for issues #53, #55, #56 is out of scope for this BUG; tracked as a follow-up CHORE because the work shape (one-time data backfill) is structurally different from the handler change
- No upstream MCP SDK or Octokit major-version breaking changes between merge and deploy

### Actuals (filled post-execution)

| Phase | Wait dependency | Estimate | Actual | Delta |
|---|---|---|---|---|
| Spec score iteration | None | 15 min | TBD | TBD |
| File via score_and_file | None | 1 min | TBD | TBD |
| PR review | implw completes | 20 min | TBD | TBD |
| Manual smoke | Deploy | 5 min | TBD | TBD |
| Retroactive triage | After merge | 5 min | TBD | TBD |
| Total | | 46 min | TBD | TBD |

## Run locally (optional)

```bash
cp /mnt/c/Users/zilin/Downloads/2026-05-10__bug__run-impl-missing-scored-md-commit-v1.scored.md \
   /home/zilin/dev/zai/issues/

cd /home/zilin/dev/zai
gh issue create \
  --title "BUG: ZAI Run Impl creates issue without committing .scored.md" \
  --body-file issues/2026-05-10__bug__run-impl-missing-scored-md-commit-v1.scored.md \
  --label bug,zai,run-impl

# Note returned issue number, then:
implw <issue-number>
```

Or one-shot via MCP:

```
zilin:score_and_file with spec_type="bug", target_repo="zi007lin/zai"
```

---

## ZAI Spec Score

- **Rubric version:** 1.4.0
- **Spec type:** bug
- **Evaluated at:** 2026-05-10T11:37:31.362Z
- **Score:** 8/8
- **Passed:** YES
- **Filed as:** [zi007lin/zai#86](https://github.com/zi007lin/zai/issues/86)

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
