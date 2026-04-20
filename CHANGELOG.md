# Changelog

All notable changes to the ZAI validator service are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [SemVer](https://semver.org/) — but note that the `RUBRIC_VERSION` constant in `src/lib/scoreSpec.ts` is versioned **independently** from the package version. Rubric versions track the scoring-rule surface; package versions track the whole service.

## [Unreleased]

### Fixed

- **REFACTOR spec type silently downgraded to CHORE** in `src/lib/scoreSpec.ts`. The `if (raw === "refactor") return "chore";` line caused REFACTOR specs to be scored against the 5-check CHORE rubric instead of the documented 9-check REFACTOR rubric. Any prior REFACTOR-type spec that scored as `chore` must be re-uploaded to receive the correct rubric. Fixes #46.

### Added

- `docs/ZAI_SYSTEM_INSTRUCTIONS.md` (v1.2) — canonical rubric source-of-truth, authored for the first time as a file (previously lived ambiently in project knowledge and hero-copy).
- `refactor` as a first-class `SpecType` with its own 9-check rubric: Intent, Decision Tree + Trigger, Final Spec, Acceptance Criteria, Subject Migration Summary, Files, Models Applied, Migration Plan with rollback, Legal triggers.
- **Acceptance Criteria** and **Legal triggers** checks added to FEAT (7 → 9), BUG (5 → 7), and other spec types per v1.2 alignment.
- `SpecTypeError` thrown on unknown spec types — replaces the silent `"feat"` fallback. External callers that depended on the fallback will now error explicitly.
- Drift-detection test (`src/lib/scoreSpec.test.ts` — new `describe` block) reads `docs/ZAI_SYSTEM_INSTRUCTIONS.md`, asserts every documented spec type has a matching rubric implementation with the documented check count. Catches doc-vs-code drift in CI.

### Changed

- `RUBRIC_VERSION` bumped from `1.1.0` to `1.2.1`. v1.2 is the doc-aligned rubric surface; the `.1` patch reflects this fix-set.

### Breaking changes

- Specs with unrecognized `spec_type` prefixes now throw `SpecTypeError` instead of silently defaulting to `feat`. This surfaces typos and unsupported types rather than letting them score against the wrong rubric. Known impact: none — the prior fallback was never a documented contract.
- Any historical REFACTOR spec that was scored as `chore` has not been migrated. Re-upload to receive the correct scoring.

---

_This CHANGELOG is authored 2026-04-20 as part of the PR for issue #46. Prior versions of the rubric surface existed (v1.0, v1.1) but were not tracked here._
