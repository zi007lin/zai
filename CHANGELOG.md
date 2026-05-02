# Changelog

All notable changes to the ZAI validator service are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [SemVer](https://semver.org/) — but note that the `RUBRIC_VERSION` constant in `src/lib/scoreSpec.ts` is versioned **independently** from the package version. Rubric versions track the scoring-rule surface; package versions track the whole service.

## [Unreleased]

_(No unreleased changes.)_

## [1.4.0] — 2026-05-01

Implements zi007lin/zzv.io PR #35 (merged at 1c9a9eb). Mandatory `## Work Estimate` section added to every building rubric. Captures active operator time, wall-clock time with wait dependencies, assumptions, and a placeholder Actuals table to be filled post-execution. Specs scored at v1.4.0 or later require the section; pre-v1.4.0 scored specs retain their stored scores (grandfathered).

### Added

- `checkWorkEstimate(md)` detector in `src/lib/scoreSpec.ts`. Validates the `## Work Estimate` H2, the `### Active operator time` table (Phase + Estimate columns, ≥ 1 phase row + Total row), the `### Wall-clock time` table (Wait dependency + Estimate columns, ≥ 1 row + Total row), the `### Assumptions` subsection (≥ 1 bullet), and the `### Actuals (filled post-execution)` table (Phase, Estimate, Actual, Delta column headers).
- New helpers in `scoreSpec.ts`: `subsectionBody`, `tableHeaderLine`, `tableHasTotalRow`, `tableDataRowCount`. Used by `checkWorkEstimate` only; reusable for any future subsection-aware detectors.
- `WORK_ESTIMATE_SECTION` shared `SectionDef` constant — appended as the last item in every per-type `*_SECTIONS` array so the rubric order matches the documented `Appendix: rubric-count summary` table.
- 11 new tests in `scoreSpec.test.ts`: 9 backward-compat tests (one per type, asserting that pre-v1.4.0 fixtures FAIL only the new `work_estimate` check while every other check still PASSes), 1 positive test, and 9 negative tests covering each failure mode (missing H2, missing each of the four subsections, both Total-row variants, no-bullet Assumptions, missing Actuals column headers).
- New `WORK_ESTIMATE_OK` fixture block + `<type>Spec140` fixtures (per-type v1.4.0-compliant variants) inline in the test file, matching the existing template-string fixture pattern.

### Changed

- `RUBRIC_VERSION` bumped `1.3.1` → `1.4.0` (minor; new check added across all rubrics — backwards-compatible at the API layer, behavior-changing at the scoring-rule layer).
- Per-type rubric counts incremented by 1: **FEAT 9→10, BUG 7→8, HOTFIX 7→8, SPEC 6→7, CHORE 5→6, REFACTOR 9→10, RESEARCH 6→7, UX 6→7, BRAND 6→7**.
- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` Appendix table updated for every documented type; new section IDs include `work_estimate` as the last entry. Doc footer bumped to `v1.4.0`.
- Existing "scores a compliant `<type>` spec X/X passed" tests now use the new `<type>Spec140` fixtures and assert the new `(X+1)/(X+1)` count. The legacy `<type>Spec` fixtures are preserved unchanged and exercised by the new backward-compat tests.

### Added (CI)

- `.github/workflows/ci.yml` — minimal lint + test workflow on `pull_request` and pushes to `main`. Two jobs (`lint`, `test`) on `ubuntu-latest`. Replaces the previous "no PR-time CI" gap surfaced during Phase A discovery.

### Backward compatibility

- Pre-v1.4.0 scored specs are grandfathered; their stored `.scored.md` outputs are not re-validated and their scores stand.
- Specs scored at v1.4.0 or later require the `## Work Estimate` section.
- The committed legacy fixtures (`featSpec`, `bugSpec`, etc.) are not modified; the new backward-compat test suite asserts they now FAIL only the `work_estimate` check, with every other section still PASSing — proving the new check is the only behavioral delta.

### Implementation notes

- Parent SPEC (zzv.io PR #35) listed 7 spec types (FEAT, BUG, SPEC, CHORE, REFACTOR, UX, BRAND); the implementation covers **9** because the codebase has HOTFIX and RESEARCH rubrics in addition to the 7 documented. Per operator decision during Phase A, all 9 types receive the new check.
- Parent SPEC also stated REFACTOR's pre-change count as 7. The actual rubric had **9** sections; the implementation moves it to 10. This is informational — no separate ticket; the SPEC table was illustrative, not authoritative.
- No new dependencies. The detector uses the existing string/regex helpers; the test fixtures use the existing template-string pattern.
- `package.json` `lint` script changed from `eslint .` to `tsc --noEmit`. ESLint was named in the script but never actually installed in the repo's `node_modules` (pre-existing gap surfaced during Phase A). The replacement uses the already-installed TypeScript compiler in typecheck-only mode, so the CI lint job has something real to run without adding new dependencies. Adding ESLint properly is a separate cleanup CHORE.
- Branch protection is **not** configured on `zi007lin/zai` `main`. Surfaced in the implementation PR body as a follow-up CHORE candidate; out of scope for this PR.

### Reference

- Spec: zi007lin/zzv.io PR #35, merged at `1c9a9eb`
- Implementation handoff CHORE: zi007lin/zzv.io PR #36, merged at `bc041e2`

## [1.3.1] — 2026-04-20

Closes #51. Per-type Intent word caps replace the previous uniform 150-word cap (with CHORE as a 100-word exception). SPEC, REFACTOR, and RESEARCH need more framing than FEAT/BUG — the uniform cap forced authors to compress substantive context or split content into sections where it didn't belong. Additive liberalization; no previously passing spec regresses.

### Added

- `INTENT_CAPS: Record<SpecType, number>` lookup exported from `src/lib/scoreSpec.ts`. Values: FEAT 150, BUG 150, HOTFIX 150, UX 150, BRAND 150, CHORE 100, SPEC 250, REFACTOR 250, RESEARCH 200.
- `makeIntentCheck(specType)` factory — single capped Intent check parameterised by type; replaces the three separate strict/chore/loose variants.
- Drift-detection test extended: `docs/ZAI_SYSTEM_INSTRUCTIONS.md` Appendix now carries an Intent cap column, and `scoreSpec.test.ts` asserts `INTENT_CAPS` matches it for every documented type.
- Per-type Intent cap fixtures in `scoreSpec.test.ts` — boundary pass/fail cases for SPEC 240/260, REFACTOR 245/260, RESEARCH 195/210, plus FEAT 145 and CHORE 95 regression guards.

### Changed

- `RUBRIC_VERSION` bumped `1.3.0` → `1.3.1` (patch-level; additive liberalization).
- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` § 2 — Intent rows per rubric type now state the actual cap (150 / 100 / 250 / 200) with the rationale for types whose cap was raised.
- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` Appendix — rubric-count summary gains an Intent cap column; drift test parses a 4-column row regex.
- Intent-cap error message — was `"intent exceeds N-word limit — found K words"`; is now `"Intent exceeds N-word cap for spec type TYPE (found K words). Consider: (a) moving context into a Draft-of-thoughts section, (b) moving decisions into the Decision Tree, (c) if this is a multi-part <type>, decomposing into multiple specs."` Teachable failure rather than frustrating one.
- BUG and HOTFIX Intent checks now enforce a 150-word cap. Previously `checkIntentLoose` skipped the cap entirely, which drifted from the documented BUG/HOTFIX rubric (≤150 words). This aligns code with doc.

### Not changed

- Rubric counts or required section IDs per type.
- `ScoreResult` shape.
- Tokenization — Intent body is still whitespace-split via `wordCount`; the conceptual `hyphenSplitTokens` discussed in the spec was not adopted (out of scope for the per-type-cap fix).

## [1.3.0] — 2026-04-20

Part of the ZiLin Brand Family Migration REFACTOR Phase 1 (issue #48). Continues the `zi007lin/zai` → `zi007lin/zilin-spec` rename; the repo rename itself is a Phase 2 operator action, not in this release.

### Added

- **Enterprise disclosure footer** on `.scored.md` output when the spec's frontmatter carries any trigger bundle (`healthcare`, `fintech`, `financial_advisory`, `legal_services`, `government`). Canonical text sourced from `docs/brand/enterprise-disclosure.md`; drift-detection test asserts verbatim equality.
- `src/lib/renderScoredSpec.ts` — output-layer renderer extracted from `AppPage.tsx`. Pure function; unit-testable. Hosts `extractBundles`, `matchTriggeredBundles`, `TRIGGER_BUNDLES`, `ENTERPRISE_DISCLOSURE_TEXT` exports.
- `src/lib/renderScoredSpec.test.ts` — 24 new tests covering bundle extraction, trigger matching, and footer rendering behavior.
- `src/components/MigrationBanner.tsx` — Phase 1 dual-run banner. Shown only on `zai.htu.io`. Dismissal persisted via `localStorage`.
- `docs/brand/zilin-rename-rationale.md`, `zilin-family-namespace.md`, `enterprise-disclosure.md` — brand-family docs; decision trail; canonical disclosure text; reservation expiry rules.

### Changed

- `RUBRIC_VERSION` bumped `1.2.1` → `1.3.0`.
- Hero copy on the validator landing page updated: "deterministic 7-section score" was inaccurate post-v1.2 (per-type counts now 5–9). New copy: "deterministic per-type rubric score (5–9 structural checks depending on spec type)".
- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` v1.3 — change-log entry describing the footer rendering behavior; version header bumped.

### Not changed

- Rubric counts or required section IDs. The drift-detection test from #46 still passes without modification.
- `ScoreResult` shape — footer rendering lives in the output layer; scoring engine stays pure.

## [1.2.1] — 2026-04-20

### Fixed

- **REFACTOR spec type silently downgraded to CHORE** in `src/lib/scoreSpec.ts`. The `if (raw === "refactor") return "chore";` line caused REFACTOR specs to be scored against the 5-check CHORE rubric instead of the documented 9-check REFACTOR rubric. Any prior REFACTOR-type spec that scored as `chore` must be re-uploaded to receive the correct rubric. Fixes #46.

### Added

- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` (v1.2) — canonical rubric source-of-truth, authored for the first time as a file (previously lived ambiently in project knowledge and hero-copy).
- `refactor` as a first-class `SpecType` with its own 9-check rubric: Intent, Decision Tree + Trigger, Final Spec, Acceptance Criteria, Subject Migration Summary, Files, Models Applied, Migration Plan with rollback, Legal triggers.
- **Acceptance Criteria** and **Legal triggers** checks added to FEAT (7 → 9), BUG (5 → 7), and other spec types per v1.2 alignment.
- `SpecTypeError` thrown on unknown spec types — replaces the silent `"feat"` fallback. External callers that depended on the fallback will now error explicitly.
- Drift-detection test (`src/lib/scoreSpec.test.ts` — new `describe` block) reads `docs/ZAI_SYSTEM_INSTRUCTIONS.md`, asserts every documented spec type has a matching rubric implementation with the documented check count. Catches doc-vs-code drift in CI.

### Changed

- `RUBRIC_VERSION` bumped from `1.1.0` to `1.2.1`. v1.2 is the doc-aligned rubric surface; the `.1` patch reflects the fix-set.

### Breaking changes

- Specs with unrecognized `spec_type` prefixes now throw `SpecTypeError` instead of silently defaulting to `feat`. This surfaces typos and unsupported types rather than letting them score against the wrong rubric. Known impact: none — the prior fallback was never a documented contract.
- Any historical REFACTOR spec that was scored as `chore` has not been migrated. Re-upload to receive the correct scoring.

---

_This CHANGELOG is authored 2026-04-20. Prior versions of the rubric surface existed (v1.0, v1.1) but were not tracked here._
