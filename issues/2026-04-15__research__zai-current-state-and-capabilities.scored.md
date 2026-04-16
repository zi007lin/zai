# 2026-04-15__research__zai-current-state-and-capabilities

## Intent

Audit the current state of ZAI at demo.zai.htu.io/app to unblock implementation of the match-prediction-league spec. Determine the exact submission flow from spec.md to merged PR, confirm which steps are manual vs automated, and identify any blockers before running impl on the match-prediction-league scored spec.

---

## Research Questions

### 1. UI State

- What does `demo.zai.htu.io/app` render today — file upload, paste, or submit button?
- What is the output format — rendered markdown, JSON, downloadable file?

### 2. GitHub Integration

- Is ZAI wired to `zi007lin/streettt` repo for auto-issue creation?
- Can ZAI auto-create a GitHub issue from a scored spec?
- Does ZAI open a PR directly or require `implw` manually?

### 3. ZiLin-BS Integration

- Does ZiLin-BS fire on ZAI issue creation or only on PR merge?
- Is the contabo-zilin runner aware of ZAI-generated issues?
- What secrets are required: ANTHROPIC_API_KEY, STREETTT_PRIVATE_TOKEN?

### 4. Scoring Pipeline

- What validation passes does the scorer run?
- What is the output format of a scored spec file?
- Is scoring automated or does it require human review steps?

### 5. daniel-silvers Approval Gate

- At what step does daniel-silvers enter the flow?
- Is there a ZAI-specific approval UI or does it go through standard GitHub PR review?

### 6. Parked Items

- ZAI rename to ZiSpec — active or parked?
- Does zzv.io migration block ZAI demo deployment?
- Is the history scrub still parked?

---

## Acceptance Criteria

- [ ] Full submission flow documented with each step labeled manual or automated
- [ ] ZAI scoring rubric version and all section names confirmed
- [ ] Blockers to running match-prediction-league spec listed
- [ ] Report saved to `issues/2026-04-15__research__zai-current-state-and-capabilities.md`

---

## Report Format

Output must be a single markdown document with sections in this order:

```
## Submission Flow
## ZAI Scoring Rubric
## GitHub Integration Status
## ZiLin-BS Integration Status
## daniel-silvers Approval Gate
## Parked Items Status
## Blockers
## Recommendation
```

---

## Subject Migration Summary

| | |
|---|---|
| What | ZAI capabilities audit to unblock match-prediction-league implementation |
| State | Spec complete; not yet implemented |
| Open questions | ZiLin-BS trigger point; daniel-silvers approval gate step |
| Next action | `impl i 2026-04-15__research__zai-current-state-and-capabilities.scored.md` |

---

## Files

```
issues/2026-04-15__research__zai-current-state-and-capabilities.md
```

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** research
- **Evaluated at:** 2026-04-16T06:57:00.006Z
- **Score:** 6/6
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| research_questions | PASS |
| acceptance_criteria | PASS |
| report_format | PASS |
| migration_summary | PASS |
| files_list | PASS |

_Source: 2026-04-15__research__zai-current-state-and-capabilities-v7.md_
