---
spec_type: bug
rubric_version: 1.2
bundles: []
---

# bug: Intent token cap of 150 is too tight for SPEC, REFACTOR, and RESEARCH types

**Spec type:** BUG
**Target:** `zi007lin/zai` (to become `zi007lin/zilin-spec` per brand migration)
**Severity:** Low-to-medium — doesn't block passing specs today (authors compress artificially), but corrupts Intent content across the three affected types
**Author:** zi007lin
**Approver:** daniel-silvers
**Date:** 2026-04-20

---

## Intent

The current ZAI rubric enforces a uniform `Intent ≤ 150 tokens` cap on all spec types except CHORE (100 tokens). This cap is calibrated for FEAT and BUG specs where compression is a virtue — if a FEAT Intent runs long, the FEAT is probably doing too much and should decompose. But SPEC, REFACTOR, and RESEARCH types legitimately need more framing: SPEC must name actors and scope deferrals, REFACTOR must carry the trigger plus reversibility caveats plus scope splits, RESEARCH must set up context for the questions that follow. Observed in practice across three specs drafted in the current session: the HTU Builder Pipeline SPEC, the ZiLin brand migration REFACTOR, and the Run Impl pipeline RESEARCH spec each bumped against or exceeded the 150-token cap despite having substantive content that couldn't compress further without losing meaning. Authors who hit the cap either truncate Intent to fit (losing context) or split content into other sections where it doesn't belong. Fix: raise the cap per type — SPEC 250, REFACTOR 250, RESEARCH 200 — keep FEAT/BUG/UX/BRAND at 150 and CHORE at 100.

## Repro

### Preconditions
- ZAI validator running at `zai.htu.io/app` rubric v1.3.0 (post PR #47 and #49)
- `src/lib/scoreSpec.ts` enforces `Intent ≤ 150 tokens` for all types except CHORE

### Steps
1. Draft a SPEC covering multi-actor governance with explicitly-deferred scope (e.g. `2026-04-20__spec__htu-builder-pipeline-v1.md`)
2. Upload to `zai.htu.io/app`
3. Observe Intent check outcome

### Expected
- Intent passes with content that names actors, scope, and deferrals
- Author doesn't have to artificially compress substantive framing

### Actual
- Intent either fails the 150-token check (if author was thorough), or passes with compressed content that sacrifices clarity (if author cut to fit)
- Same pattern observed on REFACTOR (brand migration spec must carry trigger + phased scope + one-way-ness of Phase 2) and RESEARCH (Run Impl pipeline research must set up 10 research questions' worth of context)
- Authors learn to play the validator rather than use Intent honestly, which is the inverse of the rubric's intent (pun acknowledged)

### Root cause

`src/lib/scoreSpec.ts` hardcodes `150` as the Intent cap for every type except CHORE. The ZAI system instructions § 2 reflect the same number. When the rubric was authored, FEAT and BUG were the primary spec types in consideration; SPEC, REFACTOR, and RESEARCH were either not yet introduced (REFACTOR didn't have its own rubric until PR #47) or less frequently exercised. The cap was never revisited per-type.

**Contributing factor:** no empirical signal loop. The validator doesn't record "how long were passing Intents on average" per type, so drift from the documented cap to actual usage couldn't surface as data.

## Fix

### Layer 1 — Per-type Intent caps

Update the cap from uniform-150 to per-type values.

`docs/ZAI_SYSTEM_INSTRUCTIONS.md` § 2 — update the Intent row in each rubric:

| Type | Current cap | New cap | Rationale |
|---|---|---|---|
| FEAT | 150 | 150 (unchanged) | Compression is a virtue; if it runs long, decompose |
| BUG | 150 | 150 (unchanged) | Symptom + cause + impact fits comfortably |
| UX | 150 | 150 (unchanged) | Design intent compresses well |
| BRAND | 150 | 150 (unchanged) | Same as UX |
| CHORE | 100 | 100 (unchanged) | Operational task; long explanation means CHORE is too big |
| SPEC | 150 | **250** | Must frame actors, scope, and deferrals |
| REFACTOR | 150 | **250** | Must carry trigger + scope split + reversibility caveat |
| RESEARCH | 150 | **200** | Sets up context for the research questions that follow |

`src/lib/scoreSpec.ts` — introduce a per-type cap lookup:

```typescript
// BEFORE (conceptual; actual code uses a flat 150 with a CHORE exception)
const INTENT_CAP = 150;
const CHORE_INTENT_CAP = 100;

// AFTER
const INTENT_CAPS: Record<SpecType, number> = {
  feat: 150,
  bug: 150,
  spec: 250,
  chore: 100,
  refactor: 250,
  research: 200,
  ux: 150,
  brand: 150,
};

export function validateIntent(spec: ParsedSpec): CheckResult {
  const cap = INTENT_CAPS[spec.type];
  const tokens = hyphenSplitTokens(spec.intentSection);
  if (tokens.length > cap) {
    return {
      pass: false,
      message: `Intent exceeds ${cap}-token cap for ${spec.type} (found ${tokens.length})`,
    };
  }
  return { pass: true };
}
```

### Layer 2 — Drift test extension

Extend the existing drift-detection test (from PR #47) to cover Intent caps:

```typescript
// src/lib/scoreSpec.test.ts — new test
test("Intent caps in scoreSpec match ZAI_SYSTEM_INSTRUCTIONS appendix", () => {
  const documented = parseAppendixIntentCaps(doc); // new parser helper
  for (const [type, expectedCap] of Object.entries(documented)) {
    expect(INTENT_CAPS[type]).toBe(expectedCap);
  }
});
```

Requires extending the Appendix in `ZAI_SYSTEM_INSTRUCTIONS.md` with a per-type Intent-cap table so the parser has something to read. The existing count table gets a new column:

```markdown
| Type | Count | Intent cap (tokens) | Ordered section IDs |
|---|---|---|---|
| feat | 9 | 150 | intent, decision_tree, ... |
| bug | 7 | 150 | intent, repro, ... |
| spec | 6 | 250 | intent, decision_tree, ... |
| ... | ... | ... | ... |
```

### Layer 3 — Error message improvement

When Intent fails the cap, the current error says something like "Intent too long." Replace with an actionable message that names the cap and suggests action:

```
✗ Intent
  Exceeds 250-token cap for spec type REFACTOR (found 287 tokens).
  Consider: (a) moving context into a Draft-of-thoughts section,
            (b) moving decisions into the Decision Tree,
            (c) if this is a multi-part refactor, decomposing into multiple specs.
```

This makes the failure teachable rather than frustrating.

### Non-fix: standard-deviation based caps

Considered and rejected. Stddev-based caps would adapt to corpus usage but introduce non-determinism (same spec scoring differently as corpus updates) and feedback-loop drift (longer Intents breed permission for even longer Intents). A static per-type cap is more predictable, easier to teach, and matches the validator's stated philosophy of deterministic structural analysis. Out of scope for this BUG.

## Acceptance Criteria

- [ ] `src/lib/scoreSpec.ts` replaces flat-150 Intent cap with per-type `INTENT_CAPS` lookup
- [ ] `INTENT_CAPS` values match table in Fix § Layer 1: FEAT/BUG/UX/BRAND 150, CHORE 100, SPEC 250, REFACTOR 250, RESEARCH 200
- [ ] `docs/ZAI_SYSTEM_INSTRUCTIONS.md` § 2 rubric tables updated with new caps per type
- [ ] `docs/ZAI_SYSTEM_INSTRUCTIONS.md` Appendix table adds Intent cap column
- [ ] Drift-detection test extended to assert Intent caps match the Appendix
- [ ] Error message on cap violation names the specific cap and suggests decomposition or relocation
- [ ] Existing specs that currently pass 150-token cap continue to pass (regression test using real fixtures from current session's drafts)
- [ ] The HTU Builder Pipeline SPEC, brand migration REFACTOR, and Run Impl RESEARCH specs can all be re-uploaded without needing artificial compression
- [ ] CHANGELOG.md entry for v1.3.1 documents the per-type cap and references this BUG
- [ ] Rubric version bumps v1.3.0 → v1.3.1 (patch-level, additive liberalization)

## Subject Migration Summary

| Subject | From | To | Notes |
|---|---|---|---|
| Intent cap per type | Uniform 150 (CHORE exception at 100) | Per-type lookup: FEAT/BUG/UX/BRAND 150, CHORE 100, SPEC 250, REFACTOR 250, RESEARCH 200 | Liberalizing change; no existing spec regresses |
| Rubric version | v1.3.0 | v1.3.1 | Patch-level bump; additive |
| Drift test scope | Count + ordered section IDs | Count + ordered IDs + Intent caps | Extension, not replacement |
| Error message on violation | "Intent too long" | Names cap, suggests decomposition or relocation | Teachable failure |
| Appendix in system instructions | Count table | Count + Intent cap table | One new column |
| Prior-passing specs | Pass on 150 | Still pass (150 is minimum under new regime) | No regression |
| Prior artificially-compressed specs | Compressed to fit 150 | Can be re-authored with legitimate framing (authors' option, not required) | New specs benefit immediately |
| Stddev-based caps | Considered | Rejected | Non-determinism + drift risk |
| Open questions | — | — | (1) Should FEAT cap also rise slightly (say 175) given how much richer FEATs are in v1.2? Default: no — compression forcing function is working. (2) Should there be a per-type cap for other sections (e.g. Decision Tree rows, Acceptance Criteria checkboxes)? Default: no — those are self-limiting. (3) Should the Appendix table include check-pattern IDs for full machine-readability? Nice to have; deferred to future REFACTOR. (4) Should prior specs with artificially compressed Intents be re-authored retroactively? No — re-author only if an issue surfaces; otherwise leave. |

## Files

```
zi007lin/zai/ (becomes zi007lin/zilin-spec per brand migration)
  src/lib/scoreSpec.ts                         (MOD: INTENT_CAPS lookup replacing flat constant; error message improvement)
  src/lib/scoreSpec.test.ts                    (MOD: add Intent-cap drift assertion + per-type cap fixtures)
  docs/ZAI_SYSTEM_INSTRUCTIONS.md              (MOD: update § 2 Intent rows with new caps; extend Appendix table with Intent cap column)
  CHANGELOG.md                                 (MOD: v1.3.1 entry)
  issues/2026-04-20__bug__intent-token-cap.md  (NEW: spec file with github_issue frontmatter after PR creation)

Test fixtures (implicit in scoreSpec.test.ts):
  spec-intent-250-pass                         (SPEC at 240 tokens — passes under new cap)
  spec-intent-260-fail                         (SPEC at 260 tokens — fails even under new cap)
  refactor-intent-250-pass                     (REFACTOR at 245 tokens)
  research-intent-200-pass                     (RESEARCH at 195 tokens)
  feat-intent-150-pass                         (FEAT at 145 tokens — confirms FEAT unchanged)
  chore-intent-100-pass                        (CHORE at 95 tokens — confirms CHORE unchanged)
```

## Legal triggers

- **No PII, PHI, PCI, or regulated-data triggers.** Validator logic change only.
- **No Beacon compliance impact.** HTTC operations unaffected.
- **No third-party license triggers.** No new dependencies.
- **No Enterprise-customer disclosure required** (pre-commercial; no customers relying on specific cap values). If commercial customers later depend on the cap behavior, any future tightening would require notice; liberalization like this one is safe to ship silently.
- **Brand migration interaction.** Ships in `zi007lin/zai` pre-Phase-2. Post-rename, file paths update per brand migration REFACTOR; no action required by this BUG.
- Keyword sweep (contract, indemnify, PHI, PAN, royalty): clear.

---

**Pipeline:** download `-v1.md` → upload to `zai.htu.io/app` → expected `bug 7/7 PASS` → `Run impl →` to open spec PR in `zi007lin/zai`.

```bash
# Expected flow after spec PR is FSA-approved and merged:
# 1. ZiLin-Dev picks up the merged spec from issues/
# 2. Code PR opens with INTENT_CAPS change + test fixtures + doc updates
# 3. FSA approves code PR; merges to dev
# 4. deploy:dev → verify Intent caps behave per table on dev.zai.htu.io/app
# 5. deploy:demo → verify on demo
# 6. deploy:full → verify on prod
# 7. Re-upload the HTU Builder Pipeline SPEC and brand migration REFACTOR
#    to confirm they pass cleanly under the new caps
```

---

## ZAI Spec Score

- **Rubric version:** 1.2.1
- **Spec type:** bug
- **Evaluated at:** 2026-04-20T19:37:31.242Z
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

_Source: 2026-04-20__bug__intent-token-cap-per-type-v1.md_
