# BUG: ZAI web UI hard-throws on filename gate; masks real rubric feedback from authors

## Intent

ZAI's web UI hard-throws `SpecTypeError` when an uploaded filename lacks the canonical `YYYY-MM-DD__<type>__` prefix, before any scoring runs. The HTU Skills MCP scorer at `zzv-skills.ds-6af.workers.dev/mcp` scores the same file content correctly against rubric v1.5.0, returning per-check breakdowns. The web UI bug therefore does not break scoring — it breaks the **iteration loop**. Authors with a single fixable rubric miss (e.g. missing `### Who benefits` H3 → 9/10 PARTIAL) never see the diagnosis because the filename guard fires first; they only see `Uncaught (in promise)` in DevTools while the left card claims `Spec loaded ✓`. Fix layers the resolution: catch the throw, gate the "loaded" state on validate resolution, and add H1 + frontmatter fallbacks so authentic ZiLin-Methodology specs are scored even when filenames are non-canonical.

## Repro

### Preconditions

- ZAI deployed at `dev.zai.htu.io/app` (build `index-n94fcfx6.js`).
- Authenticated user session.
- Two test fixtures (provided with this BUG):
  - `example-feat-broken.md` — H1 `# FEAT: Pre-trade compliance check API for derivative trades`; non-canonical filename; missing `### Who benefits` H3 subsection inside `## Game Theory Cooperative Model review`.
  - `example-feat-fixed.md` — same H1, same non-canonical filename, but with `### Who benefits` H3 added.

### Steps

1. Navigate to `dev.zai.htu.io/app`.
2. Click "Score a spec".
3. Select `example-feat-broken.md` from the file picker.
4. Observe left card, right panel, and DevTools console.
5. Repeat with `example-feat-fixed.md`.

### Expected

- ZAI infers spec type from H1 (`# FEAT:` → `feat`) when filename parsing fails.
- For `example-feat-broken.md`: right panel renders FEAT rubric showing 9/10 PARTIAL with the specific error `game_theory: missing required subsections: "Who benefits"`.
- For `example-feat-fixed.md`: right panel renders FEAT rubric showing 10/10 PASS.
- No `Uncaught (in promise)` errors in console.
- Left card state matches right panel state.

### Actual

- Both files: left card transitions to `Spec loaded ✓ <filename>` with success styling.
- Both files: right panel continues to display empty-state placeholder.
- Both files: DevTools console shows `Uncaught (in promise) SpecTypeError: Unknown spec type "(no type prefix in filename "<filename>")". Known: feat, bug, hotfix, spec, chore, refactor, research, ux, brand.` at `index-n94fcfx6.js:40` (Km / Gm).
- Author cannot distinguish a 9/10 PARTIAL spec from a 10/10 PASS spec via the web UI — both produce identical (silent) UI behavior.

### Independent verification via HTU Skills MCP scorer

The local rubric (the `score_spec` tool in the zilin MCP connector) scores the same file contents correctly:

| Fixture | Result | Detail |
|---|---|---|
| `example-feat-broken.md` content + `spec_type: feat` | **9/10 PARTIAL** | `game_theory: missing required subsections: "Who benefits"` |
| `example-feat-fixed.md` content + `spec_type: feat` | **10/10 PASS** | All 10 rubric checks pass |

Both ran against rubric v1.5.0. The scoring logic is intact; the web UI's filename gatekeeper is the only failure point.

### Root cause

Three independent defects compound, in increasing order of user impact:

1. **No catch on the upload-validate promise chain.** `SpecTypeError` is thrown from filename type-detection inside an async handler the upload flow does not `.catch()`. The rejection propagates as `Uncaught (in promise)` instead of routing to UI error state.
2. **Premature success state transition.** The "Spec loaded" state is set when file read resolves, before validate resolves. When validate rejects, the success state is not rolled back. UI shows `loaded ✓` while right panel shows empty state.
3. **Filename-only type detection with no fallback.** The detector tokenizes the filename around `__` delimiters and looks for a known type in slot 2. When tokenization fails, it throws. The document body — which contains the unambiguous H1 prefix `# FEAT:` — is never consulted. This single defect blocks every author whose filename is non-canonical, regardless of whether the spec content is sound. The fixture pair proves the cascade: a 1-rubric-miss spec and a perfect spec are indistinguishable to the author.

## Fix

### Layer 1 — Catch the rejection and surface it to UI

In the upload handler, wrap the validate call in `.catch()`. Route `SpecTypeError` and any other validation failure to an error state rendered in the right panel as a red banner with the error message and remediation guidance. Eliminate the `Uncaught (in promise)` console signature.

```typescript
// upload handler (current shape, defect)
const result = await validateSpec(file);
setUiState({ loaded: true, score: result });

// fixed shape
try {
  setUiState({ loading: true });
  const result = await validateSpec(file);
  setUiState({ loaded: true, score: result, error: null });
} catch (err) {
  setUiState({ loaded: false, score: null, error: toUiError(err) });
}
```

### Layer 2 — Gate "Spec loaded" on successful type resolution

The left card must not flip to the success state until `validateSpec` resolves. Introduce an intermediate `loading` state during the validate call. On rejection, leave the upload zone in pre-upload state with the error banner visible.

UI contract:

- pre-upload → loading → loaded (right panel renders score)
- pre-upload → loading → error (right panel renders banner; left card stays pre-upload)

No state transition skips `loading`.

### Layer 3 — H1 and frontmatter fallback chain before throwing

Before throwing `SpecTypeError`, the type detector attempts a fallback chain:

1. **Primary** — filename pattern `YYYY-MM-DD__<type>__<title>(-vN)?(\.scored)?\.md`.
2. **Fallback A** — first H1 line regex: `^#\s+(FEAT|BUG|SPEC|CHORE|REFACTOR|UX|BRAND)[:\s]` (case-insensitive). Maps to lowercase type.
3. **Fallback B** — YAML frontmatter `spec_type:` field if frontmatter block is present.
4. **Final** — throw `SpecTypeError` with remediation message: "Could not infer spec type from filename, H1, or frontmatter. Select a type from the dropdown."

Detector returns `{ type, source: 'filename' | 'h1' | 'frontmatter' }` so the scoring panel can display provenance to the operator.

Layer 3 closes both fixtures: `example-feat-broken.md` and `example-feat-fixed.md` resolve to `feat` via Fallback A. After Layer 3 lands, the broken fixture renders the 9/10 PARTIAL breakdown the author needs to iterate; the fixed fixture renders 10/10 PASS.

## Acceptance Criteria

- [ ] Uploading `example-feat-broken.md` (the provided fixture) renders a FEAT rubric breakdown showing 9/10 PARTIAL and the specific error `game_theory: missing required subsections: "Who benefits"` in the right panel.
- [ ] Uploading `example-feat-fixed.md` (the provided fixture) renders a FEAT rubric breakdown showing 10/10 PASS in the right panel.
- [ ] A "type inferred from H1" provenance label appears near the type badge when the type is resolved via Fallback A.
- [ ] Uploading a file with no resolvable type (no filename prefix, no H1 prefix, no frontmatter) renders an in-UI red banner with remediation message; left card stays pre-upload.
- [ ] DevTools console shows zero `Uncaught (in promise)` errors across all three upload paths (broken fixture, fixed fixture, unresolvable fixture).
- [ ] No upload path produces the contradictory state "Spec loaded ✓" + empty-state right panel.
- [ ] Existing canonical-filename uploads (`YYYY-MM-DD__feat__*.md`, including `.scored.md` re-uploads) continue to score with `source: 'filename'` and no behavioral regression.
- [ ] YAML-frontmatter test fixture (`spec_type: bug`, no filename prefix, no H1 prefix) resolves to `bug` via Fallback B.
- [ ] Unit tests cover all four detector outcomes (filename hit, H1 hit, frontmatter hit, throw with remediation).
- [ ] Manual verification: the broken/fixed fixture pair produces visibly different right-panel renderings after the fix, where today they produce identical (silent) behavior.

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| Spec-type detection | Filename-only tokenization; hard throw on miss | Three-step fallback chain (filename → H1 → frontmatter), explicit error only after exhaustion |
| Failure surface | Unhandled promise rejection in console; user sees nothing | In-UI red banner with remediation guidance; console clean |
| Loaded-state semantics | "Spec loaded" set at file-read resolution | "Spec loaded" set only at validate resolution; intermediate `loading` state introduced |
| Detector return shape | Returns `string \| throw` | Returns `{ type, source }` so the UI can label provenance |
| Iteration loop for non-canonical-filename authors | Broken: a 1-check-miss spec and a 10/10 PASS spec produce identical silent web-UI behavior | Restored: author sees per-check breakdown matching what HTU Skills MCP scorer returns |
| Parity between web UI and MCP scorer | Web UI rejects what MCP accepts; authors must switch tools to learn what's wrong | Web UI and MCP scorer accept the same inputs and surface the same diagnostics |
| Open questions | Should the H1 regex also match plain title-case (e.g. `# Feature: ...`)? Should the dropdown component land in this fix or a follow-up FEAT (B3b)? Should the provenance label ("inferred from H1") be visible to operators or kept internal? | Resolved on merge |

## Files

```
src/lib/spec-type-detector.ts                          (UPDATED)
src/lib/spec-type-detector.test.ts                     (NEW)
src/components/SpecUploadCard.tsx                      (UPDATED)
src/components/ScorePanel.tsx                          (UPDATED)
src/components/ErrorBanner.tsx                         (NEW)
src/types/ui-state.ts                                  (UPDATED)
src/types/spec-detection.ts                            (NEW)
test/fixtures/example-feat-broken.md                   (NEW, provided in BUG attachments)
test/fixtures/example-feat-fixed.md                    (NEW, provided in BUG attachments)
test/fixtures/example-frontmatter-bug.md               (NEW)
test/fixtures/example-unresolvable.md                  (NEW)
issues/2026-05-15__bug__zai-spec-type-detection-fallback-v2.scored.md (NEW, audit artifact)
```

## Legal triggers

None. The fix changes structural detection logic and UI error handling within ZAI's web UI only. No PHI, PCI, PII, or contractual data is added, removed, or reclassified. No third-party API surface changes. No license declaration affected. The HTU Skills MCP scorer at `zzv-skills.ds-6af.workers.dev/mcp` is unchanged. The existing ZAI disclaimer about non-legal-advice continues to apply unchanged.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Detector refactor (filename → fallback chain, return shape change) | None | 90 min |
| Detector unit tests (4 outcomes, 4 fixtures including the provided pair) | Detector refactor complete | 60 min |
| Upload handler: try/catch + loading state | Detector refactor complete | 30 min |
| ErrorBanner component + ScorePanel integration | Detector refactor complete | 30 min |
| UI state machine: pre-upload → loading → loaded \| error | Upload handler complete | 30 min |
| Manual verification with provided fixture pair (broken + fixed) on dev.zai.htu.io | Deploy complete | 15 min |
| PR + review iteration | All above complete | 30 min |
| Total | | 4 h 45 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Detector refactor + tests | None | 1 day |
| UI changes (handler, banner, state machine) | Detector merged | 1 day |
| Deploy to dev + manual fixture verification | UI changes merged | 0.5 day |
| Approver review and merge to main | Manual verification clean | 0.5 day (waits on daniel-silvers) |
| Total | | 3 days |

### Assumptions

- Operator has local clone of `zi007lin/zai` with build tooling configured.
- The HTU Skills MCP scorer remains the source of truth for rubric logic; the web UI fix only restores parity with what the MCP already scores correctly.
- ZAI rubric registry vocabulary inconsistency (error message lists `hotfix` and `research`, neither is in rubric v1.5.0) is tracked as a separate follow-up CHORE, not in scope here.
- The B3b follow-up (explicit type dropdown for the long tail) is a separate FEAT, not in scope here.
- No backend API contract change; `POST /api/v1/score-file` continues to accept the existing multipart shape. Type inference moves entirely to the client OR remains server-side per current architecture (operator's choice at implementation time).
- daniel-silvers is available for approver review within 1 day of PR open.

### Actuals (filled post-execution)

| Phase | Wait dependency | Estimate | Actual | Delta |
|---|---|---|---|---|
| Detector refactor + tests | None | 1 day | TBD | TBD |
| UI changes | Detector merged | 1 day | TBD | TBD |
| Deploy + manual verification | UI changes merged | 0.5 day | TBD | TBD |
| Approver review and merge | Manual verification clean | 0.5 day | TBD | TBD |
| Total | | 3 days | TBD | TBD |

## Run locally (optional)

```bash
cp /mnt/c/Users/zilin/Downloads/2026-05-15__bug__zai-spec-type-detection-fallback-v2.scored.md \
   ~/dev/zai/issues/

cd ~/dev/zai
gh issue create \
  --title "BUG: ZAI web UI hard-throws on filename gate; masks real rubric feedback from authors" \
  --body-file issues/2026-05-15__bug__zai-spec-type-detection-fallback-v2.scored.md \
  --label bug,ux,detector

# Note returned issue number, then:
implw <issue-number>
```

## Follow-up work (out of scope)

Tracked as separate specs:

- **B3b (FEAT)** — Explicit type dropdown UI for the long tail (filenames and content with no resolvable type).
- **Stale known-types list (CHORE)** — Reconcile error-message vocabulary with rubric v1.5.0 registry. Remove `hotfix` and `research` from the "Known:" list, or formally add them as accepted types with rubrics.
- **Rubric-version-skew investigation (CHORE)** — Confirm whether the deployed web UI at `dev.zai.htu.io/app` and the HTU Skills MCP at `zzv-skills.ds-6af.workers.dev/mcp` are running the same rubric version. The MCP reports v1.5.0; the deployed web UI's error-message vocabulary suggests an older registry. Single source of truth needed.

## Changelog from v1

- Renamed title from "filename-only spec-type detection; UI lies about load state" to "ZAI web UI hard-throws on filename gate; masks real rubric feedback from authors" to centre the user-impact framing.
- Added independent-verification table in Repro section showing HTU Skills MCP scorer results for the provided fixture pair (`example-feat-broken.md` → 9/10 PARTIAL with specific error; `example-feat-fixed.md` → 10/10 PASS).
- Strengthened root-cause #3 framing: the cascade impact is that authors cannot distinguish a near-pass spec from a perfect spec via the web UI today.
- Added two new acceptance criteria tied to the provided fixtures (broken renders 9/10 with `"Who benefits"` error; fixed renders 10/10).
- Updated rubric reference from v1.4.0 to v1.5.0 per HTU Skills MCP scorer output.
- Added `.scored.md` to the filename pattern in Layer 3 to handle re-uploads of previously-scored specs.
- Added rubric-version-skew follow-up CHORE.
- Added Subject Migration Summary row covering parity between web UI and MCP scorer.

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** bug
- **Evaluated at:** 2026-05-15T22:25:23.923Z
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

_Source: 2026-05-09__bug__inline.md_

