---
spec_type: bug
rubric_version: 1.2
bundles: []
github_issue: 46
---

# bug: REFACTOR spec type silently downgraded to CHORE in scoreSpec.ts

**Spec type:** BUG
**Target:** `zi007lin/zai` (the validator service itself; brownfield)
**Severity:** High — silently applies wrong rubric to an entire spec class, leading to false-pass scoring
**Author:** zi007lin
**Approver:** daniel-silvers
**Date:** 2026-04-19

---

## Intent

ZAI validator folds `refactor` into `chore` at `src/lib/scoreSpec.ts:231`, causing REFACTOR specs to be scored against the 5-check CHORE rubric instead of the documented 7-check REFACTOR rubric. The REFACTOR rubric exists in `ZAI_SYSTEM_INSTRUCTIONS.md` v1.2 but has no implementation. The discovery context: the ZiLin brand migration REFACTOR scored 2/2 (CHORE) despite declaring `Spec type: REFACTOR` and carrying full Migration Plan + Rollback + 5 applied models. A spec that should have been rigorously validated passed trivially, and would have passed the impl gate if not caught by human review of the score-blast-radius mismatch.

## Repro

### Preconditions
- ZAI validator running at `zai.htu.io/app` as of 2026-04-20T03:12:17Z
- `zai` repo at current HEAD; `src/lib/scoreSpec.ts:231` contains `if (raw === "refactor") return "chore";`

### Steps
1. Create a spec file with `**Spec type:** REFACTOR` in the header and `spec_type: refactor` in YAML frontmatter
2. Upload to `zai.htu.io/app`
3. Observe scored output

### Expected
- Spec classified as `refactor`
- Rubric applied: 7 checks (Intent, Decision Tree + Trigger, Final Spec, Acceptance Criteria, Subject Migration Summary, Files, Migration Plan with rollback, Legal triggers)
- Score display: `refactor N/7` or `refactor N/8` (whichever count the spec authoritatively defines; see Open questions in Migration Plan)

### Actual
- Spec classified as `chore`
- Rubric applied: 2 checks (CHORE minimum)
- Score display: `chore 2/2 passed: true`
- `.scored.md` emitted as if full pass
- Downstream impl pipeline treats the false pass as authoritative

### Root cause

`src/lib/scoreSpec.ts:231`:

```typescript
if (raw === "refactor") return "chore";
```

Likely a placeholder from an early scaffold ("refactor acts like chore for now") that was never revisited when the REFACTOR rubric was documented in `ZAI_SYSTEM_INSTRUCTIONS.md`. The rubric registry has no `refactor` entry, so the type-normalizer short-circuits to the nearest low-ceremony type rather than erroring.

Contributing factor: there is no test asserting that spec types documented in `ZAI_SYSTEM_INSTRUCTIONS.md` are all implemented in `scoreSpec.ts`. Documentation and implementation drifted apart silently.

## Fix

### Layer 1 — Remove the downgrade, add REFACTOR rubric

`src/lib/scoreSpec.ts` — delete line 231 (the refactor → chore redirect). Add `refactor` as a first-class spec type with its own rubric entry.

```typescript
// src/lib/rubrics/refactor.ts (NEW)
import type { Rubric } from "./types";

export const refactorRubric: Rubric = {
  type: "refactor",
  checks: [
    { id: "intent",          name: "Intent",                          test: hasIntentH2UnderLimit(150) },
    { id: "decision_tree",   name: "Decision Tree + Trigger",         test: hasDecisionTreeWithTrigger() },
    { id: "final_spec",      name: "Final Spec",                      test: hasH2("Final Spec") },
    { id: "acceptance",      name: "Acceptance Criteria",             test: hasH2WithCheckboxList("Acceptance Criteria") },
    { id: "subject_migration", name: "Subject Migration Summary",     test: hasSubjectMigrationTableWithOpenQuestions() },
    { id: "files",           name: "Files created / updated",         test: hasH2WithFencedCodeBlock(["Files", "Files created / updated"]) },
    { id: "migration_plan",  name: "Migration Plan with rollback",    test: hasMigrationPlanWithRollback() },
    { id: "legal_triggers",  name: "Legal triggers",                  test: hasLegalTriggersH2() },
  ],
};

// src/lib/rubrics/registry.ts (MOD)
import { refactorRubric } from "./refactor";
export const rubrics = {
  feat: featRubric,
  bug: bugRubric,
  spec: specRubric,
  chore: choreRubric,
  refactor: refactorRubric,    // NEW
  ux: uxRubric,
  brand: brandRubric,
};
```

Delete line 231 in `scoreSpec.ts`:

```typescript
// BEFORE
if (raw === "refactor") return "chore";

// AFTER
// (line deleted; normalizer now returns "refactor" directly)
```

The `hasMigrationPlanWithRollback()` test checks for:
- `## Migration Plan` H2 present
- At least one sub-heading containing "Rollback" (case-insensitive)
- At least one explicit rollback trigger enumerated in that section

### Layer 2 — Strict mode: fail loudly on unknown spec types

Currently if `raw` is any string not matched, it falls through to some default. After this fix, any unknown type should return an explicit error to the caller rather than silently defaulting. This prevents the same class of bug for future spec types.

```typescript
// src/lib/scoreSpec.ts — normalizer exit
const known = Object.keys(rubrics);
if (!known.includes(raw)) {
  throw new SpecTypeError(`Unknown spec type "${raw}". Known: ${known.join(", ")}`);
}
return raw as SpecType;
```

### Layer 3 — Drift-detection test

Add `src/lib/rubrics/registry.test.ts` that reads `docs/ZAI_SYSTEM_INSTRUCTIONS.md`, extracts every documented spec type from the rubric tables, and asserts each has an entry in `rubrics`. Any future doc-vs-code drift fails CI.

```typescript
// src/lib/rubrics/registry.test.ts (NEW)
import { readFileSync } from "node:fs";
import { rubrics } from "./registry";

const docPath = new URL("../../docs/ZAI_SYSTEM_INSTRUCTIONS.md", import.meta.url);
const doc = readFileSync(docPath, "utf8");

test("every spec type in ZAI_SYSTEM_INSTRUCTIONS has a rubric", () => {
  const documented = [...doc.matchAll(/^### (\w+(?:\s*\/\s*\w+)?) rubric/gmi)]
    .map(m => m[1].toLowerCase().split("/")[0].trim())
    .filter(t => t !== "bug"); // handled separately below for alias pairs

  for (const type of documented) {
    expect(rubrics[type]).toBeDefined();
  }
});

test("REFACTOR specifically has a registered rubric", () => {
  expect(rubrics.refactor).toBeDefined();
  expect(rubrics.refactor.checks.length).toBeGreaterThanOrEqual(7);
});
```

## Acceptance Criteria

- [ ] `src/lib/scoreSpec.ts:231` no longer contains `if (raw === "refactor") return "chore";` or any equivalent downgrade
- [ ] `src/lib/rubrics/refactor.ts` exists with a rubric array of ≥ 7 checks matching `ZAI_SYSTEM_INSTRUCTIONS.md` §2 REFACTOR rubric
- [ ] Uploading the ZiLin brand migration spec returns `refactor` classification and a per-check score (not `chore 2/2`)
- [ ] Uploading an intentionally-incomplete REFACTOR spec (missing Migration Plan) fails the `migration_plan` check, not passes as chore
- [ ] Unknown spec types now throw `SpecTypeError` rather than silently defaulting
- [ ] `registry.test.ts` runs in CI and fails if any type documented in `ZAI_SYSTEM_INSTRUCTIONS.md` lacks a rubric implementation
- [ ] Existing FEAT / BUG / SPEC / CHORE / UX / BRAND rubrics continue to pass their existing test suites (no regression)
- [ ] Re-scoring the ZiLin brand migration spec produces a `.scored.md` with `refactor N/8` (or 7, per rubric count) where N reflects actual rubric compliance

## Subject Migration Summary

| Subject | From | To | Notes |
|---|---|---|---|
| Refactor type handling | Silent downgrade to chore at line 231 | First-class type with own rubric | Breaking change in behavior; any prior "passing" refactor re-scores under real rubric |
| Rubric registry | 6 entries (feat, bug, spec, chore, ux, brand) | 7 entries (+ refactor) | Additive |
| Unknown-type handling | Silent fallback | Explicit `SpecTypeError` | Breaking: external callers that relied on the fallback will error |
| Drift-detection | None | Doc-vs-code registry test in CI | New CI gate |
| Prior REFACTOR specs (if any exist) | Scored as chore, presumed-valid | Must be re-scored under real rubric | Audit pass required post-deploy |
| ZiLin brand migration spec | Blocked by this bug | Unblocked after fix ships | Highest-priority consumer |
| Open questions | — | — | (1) REFACTOR rubric: 7 or 8 checks? ZAI_SYSTEM_INSTRUCTIONS.md says "FEAT minus Game Theory + Migration Plan + Legal triggers"; FEAT = 9 checks, so math yields 8. The v1.2 changelog says REFACTOR went 6→7. Spec authority is needed before merge — resolve by either updating system instructions or adjusting rubric count. (2) Should prior CHORE-scored "refactors" be flagged retroactively, or is the re-score at next upload sufficient? default: re-score on next upload, no retro sweep. (3) Do we need a migration path for any ZAI users who built tooling around the chore-score output for refactors? default: none exist yet (solo operator). |

## Files

```
zi007lin/zai/
  src/lib/scoreSpec.ts                         (MOD: delete line 231; add unknown-type throw)
  src/lib/rubrics/refactor.ts                  (NEW: rubric definition)
  src/lib/rubrics/registry.ts                  (MOD: import + register refactor)
  src/lib/rubrics/registry.test.ts             (NEW: drift-detection test)
  src/lib/rubrics/refactor.test.ts             (NEW: per-rubric unit tests with pass/fail fixtures)
  test/fixtures/
    refactor-pass.md                           (NEW: known-good REFACTOR fixture)
    refactor-missing-migration.md              (NEW: missing Migration Plan — should fail check)
    refactor-missing-rollback.md               (NEW: Migration Plan present but no Rollback subsection)
  CHANGELOG.md                                 (MOD: v1.2.1 entry documenting the fix)
  docs/ZAI_SYSTEM_INSTRUCTIONS.md              (MOD if rubric count resolves to 8 not 7; else leave)
```

## Legal triggers

- **Silent-failure integrity.** This bug caused a validator to issue passing scores on specs that were not actually rigorously validated. Any Enterprise customer who relied on `refactor` validation got CHORE-level scrutiny while believing they got full REFACTOR scrutiny. Before any regulated-industry (healthcare/fintech/legal) bundle ships, this fix must be merged and a changelog entry published. Customer-facing disclosure: none required at this stage (pre-commercial; no paying Enterprise customers yet). Post-commercial: if this fix shipped after any paid Enterprise customer uploaded REFACTOR specs, a targeted re-score notification is required.
- **No PII, PHI, PCI, or regulated-data triggers.** Bug is scoped to validator logic, no user data touched.
- **No Beacon compliance trigger.** Internal tooling, separate from HTTC operations.
- **No third-party license triggers.** No new dependencies.
- Keyword sweep (contract, indemnify, PHI, PAN, royalty): clear.

---

**Pipeline:** download `-v1.md` → upload to `zai.htu.io/app` (the very validator being fixed — note the irony) → receive `-v1.scored.md` → then run:

```bash
cp "/mnt/c/Users/zilin/Downloads/2026-04-19__bug__zai-refactor-classification-v1.scored.md" \
   "$HOME/dev/zai/issues/2026-04-19__bug__zai-refactor-classification.md"
impl i /mnt/c/Users/zilin/Downloads/2026-04-19__bug__zai-refactor-classification-v1.scored.md
```

**Note:** This BUG spec itself will score as BUG (7 checks) because BUG type is correctly wired. No meta-paradox. The brand-migration REFACTOR spec stays blocked until this fix ships.

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** bug
- **Evaluated at:** 2026-04-20T03:56:22.540Z
- **Score:** 5/5
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| reproduction_steps | PASS |
| fix | PASS |
| migration_summary | PASS |
| files_list | PASS |

_Source: 2026-04-19__bug__zai-refactor-classification-v1.md_
