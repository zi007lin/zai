# 2026-04-13__feat__zilin-bs-rubric-spec-types

**Repo:** `htu-foundation`
**Label:** `feat`
**Branch:** `htu/zilin-bs-rubric-spec-types`
**Reviewer:** daniel-silvers
**Depends on:** `2026-04-12__feat__zilin-bs-classify-command.md` (rubric v1.0.0)

---

## Spec Validation Score

| Section | Status |
|---|---|
| Intent | ✅ PASS |
| Decision Tree | ✅ PASS |
| Draft-of-thoughts | ✅ PASS |
| Final Spec | ✅ PASS |
| Game Theory Review | ✅ PASS |
| Subject Migration Summary | ✅ PASS |
| Files list | ✅ PASS |

**Score: 7 / 7 — cleared to ship**

---

## Intent

Extend `spec-rubric.yaml` from v1.0.0 to v1.1.0 to support multiple spec types (`feat`, `research`, `bug`, `chore`). Each type has a different required section set. The classifier reads the spec type from the filename prefix (`YYYY-MM-DD__TYPE__title.md`) and applies the correct section rules. This fixes false FAILs on research and chore specs that have a legitimately different structure from feat specs.

---

## Decision Tree

**Question:** How should the rubric handle different spec types?

| Option | Mechanism | Backward compatible | Decision |
|---|---|---|---|
| One rubric for all types | Current state — all types judged as feat | ❌ False FAILs on research/chore | ❌ Status quo broken |
| Per-type rubric files | `rubric-feat.yaml`, `rubric-research.yaml` | ✅ | ❌ Fragmented — hard to maintain |
| Single rubric with type-aware section sets | `spec_types` map inside `spec-rubric.yaml` | ✅ | ✅ Chosen |
| Filename prefix ignored, manual override flag | `classify spec --type research` | ✅ | ❌ Requires human to remember flag |

**Decision:** Single rubric file with a `spec_types` map. Classifier reads filename prefix to determine type automatically. No human flag needed.

**Trigger for change:** New spec type added (e.g., `hotfix`, `refactor`) → add entry to `spec_types` map, bump to v1.2.0.

---

## Draft-of-thoughts

The filename already encodes the type: `2026-04-13__research__title.md` → type = `research`. The classifier can extract this with a simple regex on the basename. If the filename doesn't match the pattern, default to `feat` (safe — most strict ruleset).

Research specs legitimately don't need:
- Decision Tree (they're discovering information, not deciding between options)
- Final Spec (they produce a report, not a spec)
- Game Theory Review (no incentive design in a research task)

Research specs DO need:
- Intent (why is this research being done)
- Research Questions (structured queries — map to `decision_tree` slot with relaxed check)
- Acceptance Criteria (what does "done" look like — must include "report saved to")
- Migration Summary (state + next actions)
- Files list (the report file path)

Chore specs (dependency bumps, cleanup) need even less — Intent + Files list is sufficient.

---

## Final Spec

### 1. Rubric v1.1.0 — updated `spec-rubric.yaml`

Replace the current file entirely:

```yaml
version: "1.1.0"

spec_types:
  feat:
    sections:
      intent:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Intent"
          - type: word_count_under
            limit: 150
      decision_tree:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Decision Tree"
          - type: table_present
          - type: column_present
            columns: ["Option", "Decision"]
          - type: string_present
            value: "Trigger for change"
      draft_of_thoughts:
        required: false
        waive_label: "SKIP"
      final_spec:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Final Spec"
          - type: heading_present
            pattern: "^#+\\s+Acceptance Criteria"
          - type: checkbox_count_gte
            minimum: 3
      game_theory:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Game Theory"
          - type: string_present
            value: "Who benefits"
          - type: string_present
            value: "Abuse vector"
          - type: string_present
            value: "Mitigation"
      migration_summary:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Subject Migration Summary"
          - type: table_row_present
            label: "Open questions"
          - type: open_questions_not_empty
      files_list:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Files"
          - type: code_block_present

  research:
    sections:
      intent:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Intent"
          - type: word_count_under
            limit: 150
      research_questions:
        required: true
        display_name: "Research Questions"
        checks:
          - type: heading_present
            pattern: "^#+\\s+Research Questions"
          - type: subheading_count_gte
            minimum: 1
      draft_of_thoughts:
        required: false
        waive_label: "SKIP"
      acceptance_criteria:
        required: true
        display_name: "Acceptance Criteria"
        checks:
          - type: heading_present
            pattern: "^#+\\s+Acceptance Criteria"
          - type: checkbox_count_gte
            minimum: 3
          - type: string_present
            value: "report saved"
      report_format:
        required: true
        display_name: "Report Format"
        checks:
          - type: heading_present
            pattern: "^#+\\s+Report Format"
      migration_summary:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Subject Migration Summary"
          - type: table_row_present
            label: "Open questions"
          - type: open_questions_not_empty
      files_list:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Files"
          - type: code_block_present

  bug:
    sections:
      intent:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Intent"
      reproduction_steps:
        required: true
        display_name: "Reproduction Steps"
        checks:
          - type: heading_present
            pattern: "^#+\\s+Repro"
      final_spec:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Fix"
          - type: heading_present
            pattern: "^#+\\s+Acceptance Criteria"
          - type: checkbox_count_gte
            minimum: 2
      migration_summary:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Subject Migration Summary"
          - type: open_questions_not_empty
      files_list:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Files"
          - type: code_block_present

  chore:
    sections:
      intent:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Intent"
      files_list:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Files"
          - type: code_block_present

  hotfix:
    sections:
      intent:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Intent"
      final_spec:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Fix"
          - type: heading_present
            pattern: "^#+\\s+Acceptance Criteria"
          - type: checkbox_count_gte
            minimum: 2
      files_list:
        required: true
        checks:
          - type: heading_present
            pattern: "^#+\\s+Files"
          - type: code_block_present
```

### 2. Classifier changes (`classify-spec.ts`)

**Type extraction (add before section evaluation):**
```typescript
function extractSpecType(filepath: string): string {
  const basename = path.basename(filepath);
  const match = basename.match(/^\d{4}-\d{2}-\d{2}__(\w+)__/);
  const rawType = match?.[1]?.toLowerCase() ?? 'feat';
  const knownTypes = ['feat', 'feature', 'research', 'bug', 'chore', 'hotfix', 'refactor'];
  // normalize aliases
  if (rawType === 'feature') return 'feat';
  if (rawType === 'refactor') return 'chore';
  return knownTypes.includes(rawType) ? rawType : 'feat';
}
```

**Score block output additions:**
```json
{
  "rubric_version": "1.1.0",
  "spec_type": "research",
  "score": "6/6",
  "passed": true,
  ...
}
```

Note: score denominator is now dynamic — it equals the number of required sections for the detected type, not always 7.

**Score display format:** `N / M` where M = required sections for this type. Example: research = `6/6`, chore = `2/2`.

### 3. Score block `<!-- zilin-bs:score -->` addition

Add `spec_type` field to the appended JSON block so the ZAI `/app` scorer page can display it.

### 4. ZAI `/app` scorer page update (`src/lib/scoreSpec.ts`)

The client-side scorer must also be updated to match rubric v1.1.0:

```typescript
// Add at top of scoreSpec.ts
function detectSpecType(filename: string): SpecType {
  const match = filename.match(/^\d{4}-\d{2}-\d{2}__(\w+)__/);
  const raw = match?.[1]?.toLowerCase() ?? 'feat';
  if (raw === 'feature') return 'feat';
  if (raw === 'refactor') return 'chore';
  const known: SpecType[] = ['feat', 'research', 'bug', 'chore', 'hotfix'];
  return known.includes(raw as SpecType) ? (raw as SpecType) : 'feat';
}

export function scoreSpec(markdown: string, filename: string = ''): ScoreResult {
  const specType = detectSpecType(filename);
  // route to type-specific section checks
  ...
}
```

The upload handler in `AppPage.tsx` must pass `file.name` to `scoreSpec()`:
```typescript
const result = scoreSpec(text, file.name);
```

Score denominator on the UI shows the correct max for the type (not always `/7`).

### 5. Score display on `/app`

- Score panel header: add small type badge next to the score: `FEAT` / `RESEARCH` / `BUG` / `CHORE`
- Score denominator: dynamic — `N / {requiredCount}` not hardcoded `/7`
- Section names: use `display_name` from rubric when present (e.g., "Research Questions" not "decision_tree")

---

## Game Theory Review

**Who benefits:** All spec types score correctly. Research specs no longer false-fail, which means BS/Dev pipelines don't get blocked on legitimate research issues. Developers using the ZAI `/app` scorer get accurate feedback regardless of what kind of spec they upload.

**Abuse vector:** Author names a feat spec `research` to avoid Decision Tree and Game Theory requirements. Mitigation: the filename convention is enforced by the impl workflow — ZiLin Issuer generates the filename based on the issue type selected. Misclassification would be visible in PR review (a spec with implementation code labeled `research`).

**Abuse vector 2:** Unknown type defaults to `feat` (most strict). This means a typo like `__freature__` gets the full feat rubric — failing loudly rather than silently passing with a lenient ruleset. This is the correct failure mode.

---

## Acceptance Criteria

- [ ] `spec-rubric.yaml` bumped to v1.1.0 with `spec_types` map for `feat`, `research`, `bug`, `chore`, `hotfix`
- [ ] `classify-spec.ts` extracts type from filename, routes to correct section set
- [ ] Unknown/aliased types normalize correctly (`feature` → `feat`, `refactor` → `chore`)
- [ ] Research spec `2026-04-13__research__zai-app-readme-homepage-alignment.md` scores 6/6 PASS
- [ ] Feat spec `2026-04-12__feat__zai-hero-tagline-governance.md` still scores 7/7 PASS
- [ ] Chore spec scores 2/2 PASS
- [ ] Score block JSON includes `spec_type` field
- [ ] Score denominator is dynamic (not hardcoded 7)
- [ ] `src/lib/scoreSpec.ts` updated to match v1.1.0 type routing
- [ ] `AppPage.tsx` passes `file.name` to `scoreSpec()`
- [ ] Score panel shows type badge (`FEAT` / `RESEARCH` / etc.)
- [ ] Score panel denominator updates correctly per type
- [ ] Unit tests updated — add research, bug, chore type test cases
- [ ] 18/18 e2e tests still pass
- [ ] `README.md` in `tools/zilin-bs/` updated with type table

---

## Subject Migration Summary

| | |
|---|---|
| What | Rubric v1.1.0 — type-aware section sets; fixes false FAILs on research/chore specs |
| State | Spec complete 7/7; not yet implemented |
| Open questions | None |
| Next action | `impl i 2026-04-13__feat__zilin-bs-rubric-spec-types.md` |
| Repos | `htu-foundation` (rubric + classifier) + `zi007lin/zai` (scoreSpec.ts + AppPage.tsx) |

---

## Files

```
htu-foundation/
├── tools/zilin-bs/spec-rubric.yaml         ← v1.0.0 → v1.1.0
├── tools/zilin-bs/classify-spec.ts         ← add type extraction + routing
└── tools/zilin-bs/classify-spec.test.ts    ← add research/bug/chore test cases

zi007lin/zai/
├── src/lib/scoreSpec.ts                    ← add type detection + routing
├── src/pages/AppPage.tsx                   ← pass file.name to scoreSpec()
└── src/components/ScorePanel.tsx           ← dynamic denominator + type badge
```
