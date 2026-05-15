# FEAT: Explicit type-selector dropdown for unresolvable specs

## Intent

After BUG #89 merged, ZAI's web UI resolves spec type via filename → H1 → frontmatter and renders a red banner when all three fail. That covers the well-formed cases but leaves a real population stranded: legacy exports, brainstorm drafts, third-party tools that produce specs without canonical signals. This FEAT adds an explicit type-selector under the error banner so authors can pick `feat`, `bug`, `spec`, `chore`, `refactor`, `ux`, or `brand` and score the upload without renaming the file or editing the body. The detector's `source` field gains a fourth value `'manual'`; the scoring panel surfaces a "manually selected" provenance chip so downstream readers can tell explicit-pick from automated-detect. Out of scope: type vocabulary changes, rubric edits, persistence across sessions.

## Decision Tree

| Decision | Options | Chosen | Why |
|---|---|---|---|
| D1: Component placement | Modal / Inline below ErrorBanner / Sidebar / Replace ErrorBanner | Inline below ErrorBanner | Keeps the error context visible alongside the resolution path; no nav cost |
| D2: When the selector renders | Always visible / Only after detector throws / Only after user clicks "Select manually" | Only after detector throws | Progressive disclosure; never competes with successful auto-detection |
| D3: UI control | `<select>` dropdown / Radio group / Button row / Combobox | Button row of 7 typed buttons | Single click, discoverable type vocabulary, no hidden options |
| D4: Selection effect | Auto-rescore on click / Show "Score now" button after selection | Auto-rescore on click | One click to outcome; matches the immediacy of the auto-detected paths |
| D5: Provenance value | Extend existing `source` enum / New `manual: boolean` field / Suppress provenance | Extend `source` to include `'manual'` | One field, four values, consistent shape across all detection paths |
| D6: Provenance label copy | "Manually selected" / "Type picked by user" / "Source: manual" | "Manually selected" | Plain English, parallel to "inferred from H1" / "inferred from frontmatter" |
| D7: Order of buttons | Alphabetical / Frequency-of-use / Methodology canonical order | Methodology canonical order (`feat, bug, spec, chore, refactor, ux, brand`) | Matches every internal doc and the rubric registry; reinforces vocabulary |
| D8: Persistence | Remember last choice in localStorage / Per-session memory / No persistence | No persistence | Each upload is independent; persistence invites stale-state bugs |
| D9: Accessibility | Buttons / Radios / Custom | Native `<button>` with `role="group"` wrapper | Built-in keyboard nav, screen-reader friendly, no custom focus handling |

### Trigger for change

Bump to v2 when: (a) ZAI rubric registry adds or removes a top-level spec type; (b) a vocabulary mismatch is found between the dropdown and the deployed error-message string (currently being tracked as a separate CHORE); (c) the manual-selection rate exceeds 30 % of uploads, signaling the auto-detect chain has a gap worth a separate fallback layer.

## Final Spec

### Component surface

`TypeSelector` renders inside `ScorePanel` only when `state.kind === 'error'` AND the error type is `SpecTypeError` (the unresolvable case from BUG #89). For other error types (network failure, malformed markdown, etc.) the selector does not render — the existing red banner is the right surface.

```tsx
// src/components/TypeSelector.tsx
type Props = {
  onSelect: (type: SpecType) => void;
  disabled?: boolean;
};

const TYPES: { id: SpecType; label: string }[] = [
  { id: 'feat',     label: 'FEAT' },
  { id: 'bug',      label: 'BUG' },
  { id: 'spec',     label: 'SPEC' },
  { id: 'chore',    label: 'CHORE' },
  { id: 'refactor', label: 'REFACTOR' },
  { id: 'ux',       label: 'UX' },
  { id: 'brand',    label: 'BRAND' },
];
```

### Detector return-shape extension

```typescript
// src/types/spec-detection.ts
export type DetectionSource = 'filename' | 'h1' | 'frontmatter' | 'manual';

export interface SpecTypeResolution {
  type: SpecType;
  source: DetectionSource;
}
```

The detector module gains a small helper for the manual path:

```typescript
// src/lib/specTypeDetector.ts
export function resolveManual(type: SpecType): SpecTypeResolution {
  return { type, source: 'manual' };
}
```

### Upload-state-machine extension

Current `error` state: terminal until user uploads a new file. After this FEAT:

- pre-upload → loading → loaded (auto-detected)
- pre-upload → loading → error (auto-detect failed; TypeSelector visible)
- pre-upload → loading → error → loading → loaded (user clicked a type button; re-scored using `resolveManual`)
- pre-upload → loading → error → (user re-uploads) → loading → ...

The state machine still rejects new state transitions outside the documented arrows.

### ScorePanel chip

The provenance chip already added in BUG #89 (`data-testid="spec-type-provenance"`) gains a fourth label string: `"manually selected"`. Existing chip styling is reused.

### API surface

No HTTP API changes. `score_spec` continues to accept `(spec_md, spec_type)` directly; the dropdown bypasses the detector and calls `scoreSpec(content, selectedType)` on the client.

## Acceptance Criteria

- [ ] Uploading a file with no resolvable type (e.g. `notes.md` with no H1 prefix and no frontmatter) shows the red ErrorBanner AND the TypeSelector button row beneath it.
- [ ] Clicking any one of the 7 type buttons immediately re-scores the upload and renders the full rubric breakdown in the right panel, with no second click required.
- [ ] After manual selection, the provenance chip reads "manually selected" (not "inferred from filename / H1 / frontmatter").
- [ ] The 7 buttons appear in methodology canonical order: `feat, bug, spec, chore, refactor, ux, brand`.
- [ ] Keyboard navigation works: Tab focuses the first button, arrow keys move between buttons, Enter or Space activates the focused button.
- [ ] Screen readers announce the button group with role and the selected button's label.
- [ ] Uploads where the detector succeeds (filename / H1 / frontmatter hit) do NOT render the TypeSelector — selector is gated on `SpecTypeError`.
- [ ] Non-`SpecTypeError` failures (e.g. file read error, malformed markdown) still render the red ErrorBanner WITHOUT the TypeSelector — the selector is the wrong remediation for those.
- [ ] No persistence: after refresh or a new upload, no prior type selection is preserved.
- [ ] Unit tests cover: render gated on error type, click handler routes through `resolveManual`, all 7 types produce the correct re-score, keyboard navigation.
- [ ] Existing BUG #89 fixtures (`example-feat-broken.md`, `example-feat-fixed.md`, `example-frontmatter-bug.md`) continue to score via their existing detection paths with no regression — TypeSelector does not render for any of them.
- [ ] A new fixture `example-unresolvable.md` (no filename type prefix, no H1 prefix, no frontmatter, body starts with prose) renders the TypeSelector; selecting `feat` and re-scoring produces the expected rubric breakdown with `source: 'manual'`.

## Game Theory Cooperative Model review

The selector closes a long-tail authoring case without disrupting the canonical-naming flow. Authors who follow the `YYYY-MM-DD__type__title.md` convention see no behavior change. Authors with non-canonical files who would previously have abandoned the upload (or copy-pasted into the MCP scorer instead) now have a one-click path to score.

### Who benefits

1. **Authors of legacy or third-party-exported specs** — gain a one-click resolution when filename, H1, and frontmatter all lack type signals. Previously: rename file, edit body, or give up and use MCP.
2. **First-time ZAI users learning the methodology** — the button row makes the 7 valid types discoverable in-product without reading docs first.
3. **ZAI maintainers** — the button order and labels become a soft enforcement of canonical vocabulary; any UI consumer that lists "research", "hotfix", or other deprecated terms is now visibly off-pattern.
4. **Audit-trail readers** — the new `'manual'` provenance source distinguishes user-asserted type from inferred type in the `.scored.md` artifact, supporting clearer downstream review.
5. **i18n efforts (future)** — type labels live in one component prop array, ready for localization. No string-extraction refactor needed when that work begins.

Honest play (uploading a spec, picking the type that matches the body) dominates every alternative. The cooperator's gain is "the spec scores correctly"; defection by mis-selecting type produces a low rubric score immediately, surfacing the error to the author.

### Abuse vector

1. **Selecting wrong type to game the rubric** (e.g. pick `chore` because the FEAT rubric is stricter). Mitigation: rubrics check structural signals specific to each type — selecting `chore` for a FEAT-shaped body fails the missing `## Action` check immediately and surfaces an obvious 0–2 / 6 score. The author sees they picked wrong; nothing downstream accepts the mis-typed artifact silently.
2. **Selector showing for non-`SpecTypeError` failures, masking real errors**. Mitigation: gate the render on `err instanceof SpecTypeError` specifically, not on `state.kind === 'error'`. Other error types continue to render the bare ErrorBanner.
3. **Race condition where user clicks a type while the prior score is still resolving**. Mitigation: button disabled prop during `loading` state; auto-rescore enqueues a new `loading` transition, blocking subsequent clicks until that resolves.
4. **Manual selection overriding a successful detection**. Mitigation: selector simply does not render when detection succeeds; there is no "change detected type" affordance. To override, the author edits the file and re-uploads.
5. **Automated upload scripts repeatedly selecting type to spam scoring**. Mitigation: out of scope for this FEAT; rate-limiting belongs at the upload endpoint and is a separate concern.

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| Unresolvable-type case | Red ErrorBanner with remediation text instructing the author to rename, add H1, or add frontmatter | Same ErrorBanner PLUS a 7-button TypeSelector for in-place resolution |
| Detector return shape | `{ type, source: 'filename' \| 'h1' \| 'frontmatter' }` | `{ type, source: 'filename' \| 'h1' \| 'frontmatter' \| 'manual' }` |
| Provenance chip values | "from filename" / "inferred from H1" / "inferred from frontmatter" | Above plus "manually selected" |
| Authoring path for non-canonical files | Rename → re-upload, or switch to MCP scorer | Pick type → score in place; no rename required |
| Type vocabulary surface area | Implicit (filename regex + H1 regex + frontmatter key) | Explicit (button row in canonical order) |
| Audit-trail provenance | Three values, all reflecting inference | Four values; explicit user-asserted type now distinguishable in `.scored.md` |
| Open questions | Should the TypeSelector also let users CHANGE a successfully detected type? Should there be an "I'm not sure" affordance that suggests a type based on rubric-checking each one? Should manual selections be telemetered to surface gaps in the auto-detect chain? | Resolved on merge |

## Files created / updated

```
src/components/TypeSelector.tsx                                 (NEW)
src/components/TypeSelector.test.tsx                            (NEW)
src/components/ScorePanel.tsx                                   (UPDATED — gates TypeSelector on err type, adds "manually selected" chip)
src/components/ErrorBanner.tsx                                  (UPDATED — composes with TypeSelector when applicable)
src/lib/specTypeDetector.ts                                     (UPDATED — exports resolveManual helper)
src/lib/specTypeDetector.test.ts                                (UPDATED — adds resolveManual tests)
src/pages/AppPage.tsx                                           (UPDATED — handleTypeSelect routes to rescore via resolveManual)
src/types/spec-detection.ts                                     (UPDATED — extends DetectionSource enum to include 'manual')
test/fixtures/example-unresolvable.md                           (UPDATED — already added in BUG #89, now also covers manual-selection path)
e2e/type-selector.spec.ts                                       (NEW)
issues/2026-05-15__feat__zai-type-selector-dropdown-v1.scored.md (NEW, audit artifact)
```

## Models Applied

- **#2 Decision Tree** — D1–D9 above record placement, trigger, control, effect, provenance, label, order, persistence, and accessibility decisions with chosen option and rationale.
- **#1 Game Theory Cooperative Model** — Game Theory section above enumerates five cooperators with their gains and five abuse vectors with mitigations. Honest play (correct type selection) dominates.
- **#11 Progressive Disclosure** — TypeSelector renders ONLY when the auto-detect chain fails. Authors with canonical files never see it; the UI surface stays minimal for the well-trodden path and expands precisely when the gap opens (D2).
- **#9 Jobs To Be Done** — Three explicit jobs: (a) "I have a spec body, I know its type, I want to score it without renaming the file"; (b) "I'm learning ZAI and want to see which types are valid"; (c) "I want my chosen type recorded in the audit artifact alongside auto-detected ones." All three serviced by the button row + provenance chip.
- **#15 Inversion / Premortem** — Abuse vector section maps five failure modes (rubric gaming, wrong-error masking, race condition, silent override, abuse-via-automation) with per-mode mitigation.

## Legal triggers

None. The fix adds a UI component and extends a TypeScript enum within ZAI's web UI. No PHI, PCI, PII, or contractual data is added, removed, or reclassified. No third-party API surface changes. No license declaration affected. The existing ZAI disclaimer about non-legal-advice continues to apply unchanged.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| TypeSelector component + styles | None | 60 min |
| Detector resolveManual helper + tests | None | 30 min |
| ScorePanel gating (render only on SpecTypeError) | TypeSelector complete | 30 min |
| Provenance chip "manually selected" wiring | ScorePanel gating done | 15 min |
| AppPage handleTypeSelect + state-machine integration | Detector helper done | 45 min |
| Keyboard nav + a11y verification | Component complete | 30 min |
| Unit tests (TypeSelector + AppPage handler + detector) | Implementation complete | 60 min |
| E2E spec (`type-selector.spec.ts`) | Unit tests passing | 45 min |
| Manual verification on dev.zai.htu.io with unresolvable fixture | Deploy complete | 15 min |
| PR + review iteration | All above complete | 30 min |
| Total | | 5 h 30 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Component + detector helper + state-machine wiring | None | 1 day |
| Tests (unit + e2e) | Implementation complete | 0.5 day |
| Deploy to dev + manual verification | Tests passing | 0.5 day |
| Approver review and merge | Manual verification clean | 0.5 day (waits on daniel-silvers) |
| Total | | 2.5 days |

### Assumptions

- Codebase is at the post-PR-#90 state: detector returns `{ type, source }`, ErrorBanner exists, state machine is `preupload → loading → loaded | error`.
- No new spec types are added to the rubric registry concurrent with this FEAT. If `epic` or another type becomes a valid top-level type, the button row gains a row but no other change is required.
- TypeSelector is purely client-side; no backend API changes; no migration of existing scored artifacts.
- The `e2e/app-scorer.spec.ts` baseline issue (predates rubric v1.5.0, called out in PR #90) is unchanged by this FEAT; the new e2e spec is independent.
- daniel-silvers is available for approver review within 1 day of PR open.

### Actuals (filled post-execution)

| Phase | Wait dependency | Estimate | Actual | Delta |
|---|---|---|---|---|
| Component + detector helper + state-machine wiring | None | 1 day | TBD | TBD |
| Tests (unit + e2e) | Implementation complete | 0.5 day | TBD | TBD |
| Deploy + manual verification | Tests passing | 0.5 day | TBD | TBD |
| Approver review and merge | Manual verification clean | 0.5 day | TBD | TBD |
| Total | | 2.5 days | TBD | TBD |

## Run locally (optional)

```bash
cp /mnt/c/Users/zilin/Downloads/2026-05-15__feat__zai-type-selector-dropdown-v1.scored.md \
   ~/dev/zai/issues/

cd ~/dev/zai
gh issue create \
  --title "FEAT: Explicit type-selector dropdown for unresolvable specs" \
  --body-file issues/2026-05-15__feat__zai-type-selector-dropdown-v1.scored.md \
  --label feat,ux,detector

# Note returned issue number, then:
implw <issue-number>
```

## Notes

- Depends on BUG #89 fix landing first (it has, via PR #90 merge `2b15475`). Detector return shape and ErrorBanner exist; this FEAT extends them rather than introducing them.
- Stale known-types list CHORE (the deployed error-message string still lists `hotfix` and `research`) is independent of this FEAT and remains in the queue. It would resolve the vocabulary on the error-message side; this FEAT resolves it on the dropdown side. Both should align on rubric v1.5.0's canonical 7-type set.

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** feat
- **Evaluated at:** 2026-05-15T23:06:10.181Z
- **Score:** 10/10
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| decision_tree | PASS |
| final_spec | PASS |
| acceptance_criteria | PASS |
| game_theory | PASS |
| migration_summary | PASS |
| files_list | PASS |
| models_applied | PASS |
| legal_triggers | PASS |
| work_estimate | PASS |

_Source: 2026-05-09__feat__inline.md_

