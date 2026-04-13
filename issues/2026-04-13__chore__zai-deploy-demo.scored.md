# 2026-04-13__chore__zai-deploy-demo

**Repo:** `zi007lin/zai`
**Label:** `chore`
**Branch:** `zai/deploy-demo`
**Reviewer:** daniel-silvers

## Intent

Promote the current `main` (commit `a182edd`) from dev to demo. All P0 and P1 alignment items are merged. The scorer is validated across all five spec types on dev. This is a deployment-only operation — no code changes.

## Acceptance Criteria

- [ ] `npm run deploy:demo` completes without error
- [ ] `demo.zai.htu.io` serves the build from commit `a182edd`
- [ ] `/app` on demo scores a research spec at 6/6 RESEARCH and a feat spec at 7/7 FEAT
- [ ] `rubric v1.1.0` visible in score block footer on demo
- [ ] Home page governance tagline visible on demo
- [ ] README P1 fixes live on demo (tagline, scorer section, chain claim)

## Files

```
# No files modified — deployment only
# Commands executed:
npm run deploy:demo
```

## Subject Migration Summary

| | |
|---|---|
| What | ZAI dev → demo promotion, commit a182edd |
| State | Spec complete; cleared to execute |
| Open questions | None |
| Next action | Merge this issue → `npm run deploy:demo` → verify demo URLs |
| Repo | `zi007lin/zai` |

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T11:15:07.006Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__zai-deploy-demo.md_
