# 2026-04-16__bug__run-impl-dispatches-to-wrong-repo

## Intent

The "Run impl →" button on demo.zai.htu.io/app dispatches to the `streettt-private` runner instead of creating an issue in `zi007lin/zai` and dispatching to the ZAI runner. This causes impl to execute against a random open issue in `streettt-private`. Every spec scored in ZAI must be implemented in `zi007lin/zai` without manual intervention.

---

## Reproduction Steps

1. Upload a passing scored spec to `demo.zai.htu.io/app`
2. Click "Run impl →" button
3. Observe: dispatch fires to `zi007lin/streettt-private` zilin-queue.yml
4. Observe: impl runs `implw <wrong_issue_number>` from `streettt-private` issue list
5. Observe: no issue created in `zi007lin/zai`
6. Observe: no PR created in `zi007lin/zai`
7. Expected: issue created in `zi007lin/zai` → dispatch to ZAI runner → PR in `zi007lin/zai`

---

## Fix

Update `functions/api/impl.ts` to target `zi007lin/zai` instead of `streettt-private`. Before dispatching, create a GitHub issue in `zi007lin/zai` using the scored spec title and body, then dispatch to the ZAI runner with the new issue number. After dispatch, update the UI to show the issue link and approval status, and disable the Run impl button to prevent duplicate dispatches.

```typescript
const issue = await createGitHubIssue({
  repo: 'zi007lin/zai',
  title: extractTitle(scoredSpec),
  body: scoredSpec,
  labels: [extractType(scoredSpec)]
})

await dispatchWorkflow({
  repo: 'zi007lin/zai',
  workflow: 'zilin-queue.yml',
  payload: { issue_number: issue.number }
})
```

## Acceptance Criteria

- [ ] Run impl button creates a new issue in `zi007lin/zai` with the scored spec as body
- [ ] Dispatch targets `zi007lin/zai` runner with the new issue number
- [ ] PR is created in `zi007lin/zai` after impl completes
- [ ] ZAI UI shows issue link and approval status after Run impl is clicked

---

## Subject Migration Summary

| | |
|---|---|
| What | Fix Run impl dispatch targeting wrong repo + missing issue creation |
| State | Spec complete; not yet implemented |
| Open questions | Does `zi007lin/zai` have a `zilin-queue.yml` workflow already wired? |
| Next action | `impl i 2026-04-16__bug__run-impl-dispatches-to-wrong-repo.scored.md` |

---

## Files

```
functions/api/impl.ts
src/components/ScoreResult.tsx
.github/workflows/zilin-queue.yml
```

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** bug
- **Evaluated at:** 2026-04-16T03:48:23.178Z
- **Score:** 5/5
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| reproduction_steps | PASS |
| fix | PASS |
| migration_summary | PASS |
| files_list | PASS |

_Source: 2026-04-16__bug__run-impl-dispatches-to-wrong-repo-v4.md_
