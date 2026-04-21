# Changelog

All notable changes to the ZAI validator service are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [SemVer](https://semver.org/) — but note that the `RUBRIC_VERSION` constant in `src/lib/scoreSpec.ts` is versioned **independently** from the package version. Rubric versions track the scoring-rule surface; package versions track the whole service.

## [Unreleased]

_(No unreleased changes.)_

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
