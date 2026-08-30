# BUG: Align ZAI authoring guidance and work_estimate diagnostics with the live rubric

## Intent

The live SPEC rubric requires `work_estimate`, but the primary rubric tables in `docs/ZAI_SYSTEM_INSTRUCTIONS.md` omit that check and retain outdated check counts. Authors following §2 can satisfy every listed SPEC requirement yet receive PARTIAL, then discover the full contract one failure at a time. Align the documentation, validator diagnostics, rubric endpoint, and authoring-tool references with live rubric version 1.5.0.

## Repro

### Preconditions

Use any SPEC-type Markdown document authored against the SPEC rubric table in `docs/ZAI_SYSTEM_INSTRUCTIONS.md` §2. That table lists six checks: Intent, Decision Tree, Rules/Content, Subject Migration Summary, Files/Schema, and Legal triggers.

### Steps

1. Satisfy all six checks listed for SPEC in §2.
2. Submit the document to `/api/v1/validate` or `prepare_github_issue` with `spec_type: spec`.
3. Add only the missing requirement named by each `work_estimate` failure and resubmit.

### Expected

The document passes when it satisfies every requirement in the primary documented SPEC rubric, or the documentation and first failure response disclose the complete live requirement before iterative resubmission.

### Actual

The result is PARTIAL, 6/7, because the live rubric includes an additional `work_estimate` check. Successive submissions exposed these five messages in order:

1. `"## Work Estimate" heading not found`
2. `missing "### Active operator time" subsection`
3. `"### Active operator time" missing markdown table`
4. `"### Active operator time" table missing required column headers (Phase, Estimate)`
5. `missing "### Wall-clock time" subsection`

Source inspection reveals additional requirements that this sequence had not yet surfaced: Total rows and minimum data-row counts for both timing tables, `### Assumptions` with a bullet, and `### Actuals (filled post-execution)` with a four-column table.

The documented `GET /api/v1/rubric/bug` route currently returns the SPA HTML shell rather than raw rubric JSON, so it cannot provide an authoritative machine-readable contract.

### Root cause

`checkWorkEstimate` was introduced in rubric 1.4.0 by commit `85b8f21a6d58b87fce0eaa93762efb1b41901d2b` (PR #82, 2026-05-02) and remains live in rubric 1.5.0. The v1.4 appendix and changelog mention it, but the primary §2 rubric tables and counts were not updated. The validator uses early returns, reporting only the first unmet sub-requirement. Separate authoring surfaces in `zi007lin/zzv-skills` still advertise rubric v1.4.0 while the deployed scorer reports v1.5.0.

## Fix

### Layer 1 — Documentation

Update every affected rubric table in `docs/ZAI_SYSTEM_INSTRUCTIONS.md` §2 to include `work_estimate`, and update each check count. Document the complete source-confirmed contract:

- `## Work Estimate`
- `### Active operator time`: Markdown table containing `Phase` and `Estimate`; at least one phase row plus a `Total` row
- `### Wall-clock time`: Markdown table containing `Wait dependency` and `Estimate`; at least one dependency row plus a `Total` row
- `### Assumptions`: at least one `-` or `*` bullet
- `### Actuals (filled post-execution)`: Markdown table containing `Phase`, `Estimate`, `Actual`, and `Delta`

State that column and subsection order is not enforced, extra columns are allowed, and no estimate units or Actuals row count are enforced. Cover FEAT, BUG, HOTFIX, SPEC, CHORE, REFACTOR, RESEARCH, UX, and BRAND; do not add it to EPIC unless the live EPIC rubric changes. Add a §13 changelog entry and bump the document version.

### Layer 2 — Validator error messages

Change `checkWorkEstimate` to return the full set of unmet requirements in one response: all missing headings, subsections, tables, required headers, Total rows, minimum rows, and assumptions bullets. Preserve stable, actionable wording. Fixing documentation alone would leave the next drifted or malformed document equally expensive to diagnose.

### Layer 3 — Rubric API

Implement or restore the documented `GET /api/v1/rubric/:type` JSON endpoint so `GET /api/v1/rubric/bug` returns the live BUG rubric contract and version instead of the SPA HTML shell. Add coverage preventing Pages fallback routing from masking the API route.

### Layer 4 — Tooling consistency

Update the `draft_spec` MCP description, template-engine header, and every other tool or documentation surface that references a rubric version or check count. Prefer one generated/shared version source so these values cannot drift independently from the validator.

## Acceptance Criteria

- [ ] `docs/ZAI_SYSTEM_INSTRUCTIONS.md` documents `work_estimate` for every rubric type that has it live, with exact headings, table columns, Total-row rules, and minimum row counts.
- [ ] A SPEC authored strictly from the updated §2 documentation scores full PASS on first submission.
- [ ] A failing `work_estimate` check returns all unmet sub-requirements in one response rather than one per resubmission.
- [ ] `GET /api/v1/rubric/bug` returns JSON describing the live BUG rubric and `rubric_version`, not the SPA shell.
- [ ] `draft_spec`, template metadata, documentation, and other rubric-version references agree with the live rubric version.
- [ ] Automated tests cover documentation drift, aggregate diagnostics, and rubric API routing.

## Subject Migration Summary

| Subject | From | To |
|---|---|---|
| work_estimate documentation | Present only in later appendix/changelog material; absent from primary §2 rubric tables | Fully documented in every affected §2 rubric with exact source-confirmed requirements |
| work_estimate failure reporting | First unmet sub-requirement per response | All unmet sub-requirements in one response |
| Rubric API | Documented route returns SPA HTML | Versioned, machine-readable rubric JSON |
| Rubric version references | Inconsistent across v1.4.0 authoring surfaces and v1.5.0 live scorer | Single source of truth; all references agree |
| Open questions | Scope and history required source inspection | Decide whether HOTFIX remains an internal-only type and whether API contracts should expose regex tolerance or only canonical forms |

## Files

```
docs/ZAI_SYSTEM_INSTRUCTIONS.md
src/lib/scoreSpec.ts
src/lib/scoreSpec.test.ts
functions/api/rubric/[type].ts (or repository-conventional equivalent)
zi007lin/zzv-skills/src/tools/draft_spec.ts
zi007lin/zzv-skills/src/lib/template-engine.ts
```

## Legal triggers

None. This is an internal documentation, validation, API-routing, and tooling-consistency bug. It introduces no contract, license, PHI, PAN, liability, or compensation terms.

## Work Estimate

### Active operator time

| Phase | Estimate |
|---|---:|
| Update documentation and shared version references | 45 minutes |
| Aggregate validator diagnostics and tests | 75 minutes |
| Restore rubric API route and routing tests | 60 minutes |
| Cross-repository tooling consistency validation | 15 minutes |
| **Total** | **3 hours 15 minutes** |

### Wall-clock time

| Wait dependency | Estimate |
|---|---:|
| Review, CI, and cross-repository coordination | 1–3 days |
| **Total** | **1–3 days** |

### Assumptions

- The existing source validator remains the behavioral authority while documentation and API output are brought into sync.
- Changes to `zi007lin/zzv-skills` may require a separate linked implementation issue or PR in that repository.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---:|---:|---:|
| Documentation | 45 minutes | TBD | TBD |
| Validator diagnostics | 75 minutes | TBD | TBD |
| Rubric API | 60 minutes | TBD | TBD |
| Tooling consistency | 15 minutes | TBD | TBD |
| **Total** | **3 hours 15 minutes** | **TBD** | **TBD** |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** bug
- **Evaluated at:** 2026-08-30T21:48:15.936Z
- **Score:** 8/8
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
| work_estimate | PASS |

## Provenance (auto-materialized)

- **Source:** inline-scored issue body — zi007lin/zai#124
- **Materialized at:** 2026-08-30
- **Filename derivation:** derived from issue (§4.1 rule 2) — the issue body's `_Source:` footer pointed to the literal generic slug `inline`, which rule 1 explicitly excludes; filename built from the issue's `createdAt` UTC date (2026-08-30), the `BUG:` title-prefix type, and a kebab-case slug summarizing the fix scope.
- **Acquisition path:** MCP → GitHub Issue → implw acquisition (Path B, inline-scored).
- **Integrity re-score:** re-ran `scoreSpec()` locally against the stripped issue body before implementation; result matched the stored score block exactly (rubric 1.5.0, bug, 8/8, PASS).

**Note on cross-repo scope:** Layer 4's `zi007lin/zzv-skills` references (`draft_spec.ts`, `template-engine.ts`) are out of scope for this repo per the spec's own Assumptions — tracked as a follow-up issue to be filed in `zi007lin/zzv-skills`, not implemented here.
