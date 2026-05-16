# EPIC: ZAI ecosystem auto-fix — vocabulary reconciliation, examples canonical pair, Node 24 cross-repo replication

## Intent

After PRs #90, #92, and #94 merged on `zi007lin/zai`, the detector fallback, Node 24 actions bump, and TypeSelector all ship. Four loose ends remain across multiple repos: (1) the `SpecTypeError` runtime message still lists `hotfix` and `research` as "Known:" types, neither of which exists in rubric v1.5.0; (2) `zi007lin/zai-examples` ships only non-canonically-named fixtures that worked as BUG #89 test cases but mislead newcomers about the canonical naming pattern; (3) four other HTU repos (`htu-foundation`, `htu.io`, `streettt`, `zzv-skills`) still run CI on `actions/checkout@v4` and `actions/setup-node@v4`; (4) the post-merge state of `zai` has not been deployed to `dev.zai.htu.io/app` for the BUG #89 and FEAT #93 manual-verification AC items. Bundling these into one tracked EPIC gives a single review surface, coordinated audit trail, and clear escape hatches per phase, instead of five fragmented small issues.

## Architectural decision

**Bundle as EPIC, not as five separate specs.** Rationale below.

| Decision | Options | Chosen | Why |
|---|---|---|---|
| AD1: Spec form | Five separate small specs (one CHORE for vocab, one CHORE for examples, four CHOREs for Node 24, one operator task) / One EPIC with phases / One mega-CHORE | One EPIC with phases | Each phase has its own AC and PR but they share a coherent post-#89/#91/#93 cleanup story; EPIC gives daniel-silvers one review thread and audit artifact instead of seven |
| AD2: Phase boundary | Per-repo / Per-concern / Per-risk-class | Per-concern, then per-repo within Phase 3 | Phase 1 (vocab) and Phase 2 (examples) are single-repo concerns; Phase 3 (Node 24) is genuinely per-repo and parallelizable |
| AD3: Phase order | Riskiest-first / Cheapest-first / Dependency order | Cheapest-and-lowest-risk first (vocab → examples → Node 24 → verify) | Each early phase is independently shippable; failure in a later phase doesn't unwind earlier value |
| AD4: Cross-repo orchestration | One mega-branch (impossible across separate repos) / One PR per repo / Reuse #91 spec template per repo | One PR per repo using #91 as template | Five repos, five reviewers, five independent rollbacks |
| AD5: Operator vs autonomous scope | Include deploy + manual verification as ZiLin-Dev steps / Out of scope / Listed in Tracking checklist for operator | Listed in Tracking checklist for operator | Deploy requires operator credentials on Cloudflare and visual inspection on `dev.zai.htu.io`; out of autonomous capability |

### Trigger for change

Re-open the EPIC if: (a) rubric registry vocabulary changes mid-EPIC (would invalidate Phase 1); (b) Node 24 GA cutover date moves earlier than planned (forces Phase 3 ordering); (c) any phase's PR is rejected by daniel-silvers (returns to drafting that phase's child spec).

## Phases

### Phase 1 — `zi007lin/zai` runtime vocabulary

**Status:** Pending

**Depends on:** BUG #89 / PR #90 merged (already landed; provides the detector module Phase 1 edits).

**Scope:** Reconcile the `SpecTypeError` message string with rubric v1.5.0. Remove `hotfix` and `research` from the "Known:" list; final canonical seven: `feat, bug, spec, chore, refactor, ux, brand`. Grep the codebase for any other hardcoded vocabulary that's drifted (test fixtures, error strings, README excerpts).

**Files (within `zi007lin/zai`):**

```
src/lib/specTypeDetector.ts            (UPDATED — error message string)
src/lib/specTypeDetector.test.ts       (UPDATED — assertion on "Known:" list contents)
src/lib/scoreSpec.ts                   (CHECKED — verify no parallel hardcoded vocabulary)
README.md                              (CHECKED — verify type list in docs matches)
```

**Acceptance:** `grep -rn "hotfix\|research" src/` returns zero matches in error-message or type-list contexts. Existing tests pass; new assertion confirms the canonical seven.

### Phase 2 — `zi007lin/zai-examples` canonical pair

**Status:** Pending

**Depends on:** None. Independent of Phase 1; can run in parallel.

**Scope:** Add a canonical-named pair alongside the existing non-canonical pair so users see both patterns. The existing `example-feat-broken.md` and `example-feat-fixed.md` stay (they're still good H1-fallback fixtures). New: `2026-05-14__feat__pre-trade-compliance-broken-v1.md` and `2026-05-14__feat__pre-trade-compliance-fixed-v1.md` with identical content but canonical filenames. README updated to explain both work after PR #90 and which to use as a learner.

**Files (within `zi007lin/zai-examples`):**

```
2026-05-14__feat__pre-trade-compliance-broken-v1.md     (NEW)
2026-05-14__feat__pre-trade-compliance-fixed-v1.md      (NEW)
README.md                                                (UPDATED — explains canonical vs non-canonical, points to PR #90 for the H1-fallback path)
```

**Acceptance:** Both new fixtures score correctly against ZAI rubric v1.5.0 — broken → 9/10 PARTIAL, fixed → 10/10 PASS. README compiles and renders cleanly on the repo's main view.

### Phase 3 — Node 24 actions bump across four HTU repos

**Status:** Pending

**Depends on:** CHORE #91 / PR #92 merged (already landed; provides the template each per-repo PR follows).

**Scope:** Replicate the PR #92 pattern on `zi007lin/htu-foundation`, `zi007lin/htu.io`, `zi007lin/streettt`, and `zi007lin/zzv-skills`. Same approach: bump `actions/checkout@v4` → `@v5` and `actions/setup-node@v4` → `@v5` in every workflow file that uses them. Per-repo inventory step first (some may already be on `@v5` or have additional Node 20 actions worth flagging).

**Files (one PR per repo):**

```
zi007lin/htu-foundation/.github/workflows/*.yml          (UPDATED)
zi007lin/htu.io/.github/workflows/*.yml                  (UPDATED)
zi007lin/streettt/.github/workflows/*.yml                (UPDATED)
zi007lin/zzv-skills/.github/workflows/*.yml              (UPDATED)
```

**Acceptance:** Each repo's CI run on its bump PR shows zero "Node.js 20 actions are deprecated" annotations; lint and test jobs green; no behavioral regression. The PR description in each carries the same `setup-node@v5` caching decision note that PR #92 used.

### Phase 4 — Deploy `zi007lin/zai` and run manual verification (operator)

**Status:** Pending

**Depends on:** Phase 1 merged (so the deploy carries the vocabulary fix alongside the BUG #89 / FEAT #93 changes already on `main`).

**Scope:** Out of autonomous-execution capability. Operator deploys `main` of `zi007lin/zai` (now containing `2b15475` + `8abb62e` + `fabd42d` + Phase 1's commit) to `dev.zai.htu.io/app`. Then walks through the BUG #89 and FEAT #93 manual-verification AC items in a single pass.

**Files:** None.

**Acceptance:** The unchecked AC items on BUG #89 and FEAT #93 are ticked; any defect found becomes a new BUG spec, NOT a fix in this EPIC.

## Cross-model validation

- **#2 Decision Tree** — AD1–AD5 above record the strategic decisions (spec form, phase boundary, phase order, cross-repo orchestration, operator scope) with options enumerated and rationale per row.
- **#11 Progressive Disclosure** — Phases ordered cheapest-and-lowest-risk first. Each phase is shippable on its own; later phases never block earlier value from landing.
- **#15 Inversion / Premortem** — "Risks & mitigations" section below maps the failure modes for each phase and how each is bounded.
- **#16 Mechanism Design** — Each phase produces a discrete audit artifact (PR + commit); the EPIC's Tracking checklist functions as the coordination signal; partial completion never produces silent drift because each PR is independently visible.
- **#13 OODA Loop** — Phase 4 is the Observe step on the upstream phases: deploy and verify before declaring "ZAI cleanup is done." If verification surfaces new issues, the loop restarts at a new BUG spec rather than amending this EPIC.

## Risks & mitigations

| Phase | Risk | Mitigation |
|---|---|---|
| 1 | Vocabulary string is referenced in more places than `specTypeDetector.ts` (test fixtures, README, rubric registry comments). Edit misses some and "Known:" list drifts again. | Pre-edit grep across the entire repo for the deprecated terms `hotfix` and `research`; document every match in the PR description before changing any of them. |
| 1 | Test snapshot pinned to old message asserts the old vocabulary. PR fails CI. | Detect snapshot mismatch as a green signal — update snapshot in the same PR, note it in the PR body. |
| 2 | Adding canonical pair makes the older non-canonical pair look "wrong" or "deprecated" to learners. | README explicitly explains BOTH score correctly after PR #90; the non-canonical pair demonstrates the H1-fallback path the FEAT used as fixtures. Not deprecated. |
| 2 | New fixtures' scores drift if rubric v1.5.0 changes. | Score each via the MCP `score_spec` tool before committing; the scored output is committed alongside. Future rubric drift gets caught at score-validation time. |
| 3 | A target repo already partially-bumped (some workflows on `@v5`, others on `@v4`). | Per-repo inventory step before edits, mirroring the PR #92 pattern; PR description lists which files were already at `@v5`. |
| 3 | A target repo has additional Node 20 actions beyond `checkout` and `setup-node` (e.g. `cache`, `upload-artifact`). | The inventory step grep is broad: `actions/.*@v4`. Out-of-scope hits are flagged in the PR description as a follow-up CHORE per repo, not silently bumped. |
| 3 | One repo's CI behaves differently (e.g. monorepo, custom Node version pin). | Each PR runs independently; failure in one does not block the other three from merging. |
| 4 | Manual verification surfaces a real defect. | New BUG spec filed; this EPIC stays closed at end of Phase 3, and the defect is tracked separately so the cleanup record stays clean. |

## Escape hatch

**Per-phase reversibility:**

- **Phase 1 revert** — Single-PR revert on `zi007lin/zai`. The runtime message goes back to listing `hotfix, research` (cosmetic, same as today); no behavioral effect on the fallback chain.
- **Phase 2 revert** — Single-PR revert on `zi007lin/zai-examples`. Removes the two new fixtures and the README addition; the original non-canonical pair stays in place untouched.
- **Phase 3 revert** — Per-repo single-PR revert. Each PR is independently shippable and independently revertible. Reverting one does not affect the other three.
- **Phase 4 revert** — Re-deploy the previous `dev.zai.htu.io/app` build via Cloudflare Pages rollback. Manual verification artifacts (screenshots, console logs) are operator-side and don't need explicit revert.

**EPIC-level abort:** If any phase reveals an upstream architectural problem (e.g. a fifth defect in the BUG #89 fallback chain), close this EPIC, file a new BUG, and re-plan. The completed phases stay merged.

## Cost projection

| Phase | Active operator time | Wall-clock |
|---|---|---|
| Phase 1 (zai vocabulary) | 30 min | 0.5 day |
| Phase 2 (zai-examples canonical pair) | 30 min | 0.5 day |
| Phase 3 (Node 24 × 4 repos) | 45 min × 4 = 3 h | 2 days (parallelizable; each PR is independent) |
| Phase 4 (operator deploy + verify) | 15 min | 0.5 day (waits on deploy window) |
| EPIC drafting + tracking overhead | 30 min | — |
| **Total** | **~5 hours** | **~3 days** with daniel-silvers review cycles |

Cost projection assumes daniel-silvers review SLA of ≤1 day per PR. Five PRs across two repos (Phases 1+2) plus four PRs in Phase 3 = nine PRs total. Sequential review is the bottleneck; parallel review across phases is possible.

## Dependencies

This EPIC depends on the following already-landed work:

- **BUG #89 / PR #90 / commit `2b15475`** — Merged. Detector return shape `{ type, source }`, ErrorBanner component, and `preupload → loading → loaded | error` state machine all on `main` of `zi007lin/zai`.
- **CHORE #91 / PR #92 / commit `8abb62e`** — Merged. Provides the reference template for Phase 3 cross-repo replication.
- **FEAT #93 / PR #94 / commit `fabd42d`** — Merged. TypeSelector, `resolveManual`, and `"manually selected"` provenance label all on `main`. Phase 4 verification covers FEAT #93 ACs as part of the same deploy.

This EPIC blocks no other work currently filed. Its completion unblocks: closing the ZAI cleanup cycle and rolling the "BUG → CHORE → FEAT → cleanup EPIC" methodology pattern as a reference example into the ZiLin Methodology skill.

## Tracking checklist

Phase-level checkboxes — daniel-silvers ticks as each PR merges, operator ticks Phase 4 items individually.

### Phase 1 — `zi007lin/zai` runtime vocabulary
- [ ] Pre-edit grep run; deprecated-term inventory documented in PR description
- [ ] PR opened against `zi007lin/zai:main`
- [ ] CI green (lint + test, zero Node 20 annotations from Phase 3 deferred)
- [ ] daniel-silvers approval
- [ ] Merged

### Phase 2 — `zi007lin/zai-examples` canonical pair
- [ ] Both new fixtures scored via MCP `score_spec`; scores attached to PR description (broken → 9/10 PARTIAL, fixed → 10/10 PASS)
- [ ] README compiles and renders cleanly on the repo's main view
- [ ] PR opened against `zi007lin/zai-examples:main`
- [ ] daniel-silvers approval
- [ ] Merged

### Phase 3 — Node 24 cross-repo replication
- [ ] `zi007lin/htu-foundation` — inventory, PR opened, CI green, merged
- [ ] `zi007lin/htu.io` — inventory, PR opened, CI green, merged
- [ ] `zi007lin/streettt` — inventory, PR opened, CI green, merged
- [ ] `zi007lin/zzv-skills` — inventory, PR opened, CI green, merged

### Phase 4 — Deploy + manual verification (operator)
- [ ] `npm run deploy` (or platform-specific deploy step) on `zi007lin/zai` `main` to `dev.zai.htu.io/app`
- [ ] BUG #89 AC: upload `example-feat-broken.md` from `zai-examples`; confirm right panel renders 9/10 PARTIAL with `game_theory: missing required subsections: "Who benefits"` shown
- [ ] BUG #89 AC: upload `example-feat-fixed.md`; confirm 10/10 PASS rendering
- [ ] FEAT #93 AC: upload `example-unresolvable.md`; confirm ErrorBanner + TypeSelector render together; click each of 7 type buttons; confirm provenance chip reads "manually selected" in each case
- [ ] FEAT #93 AC: VoiceOver / NVDA confirms the button group announces with `role="group"` and per-button label
- [ ] DevTools console clean of `Uncaught (in promise)` across all three upload paths

## Legal triggers

None. The EPIC bundles UI-string changes, additive fixture files, README copy, and GitHub Actions version bumps across HTU-owned repos. No PHI, PCI, PII, or contractual data is added, removed, or reclassified. No third-party API surface changes. No license declaration affected. The HTU Skills MCP scorer and ZAI rubric registry are not modified. The existing ZAI disclaimer about non-legal-advice continues to apply unchanged.

## Run locally (optional)

```bash
# After EPIC is filed and assigned an issue number, autonomous execution per phase:

cp /mnt/c/Users/zilin/Downloads/2026-05-15__epic__zai-ecosystem-auto-fix-v1.scored.md \
   ~/dev/zai/issues/

cd ~/dev/zai
gh issue create \
  --title "EPIC: ZAI ecosystem auto-fix — vocabulary, examples, Node 24 cross-repo" \
  --body-file issues/2026-05-15__epic__zai-ecosystem-auto-fix-v1.scored.md \
  --label epic,cleanup,cross-repo

# Then run autonomous execution phase by phase:
implw <issue-number>   # ZiLin-Dev tackles Phase 1, then 2, then 3 (×4 sub-PRs), reporting back at each merge.
```

## Notes

- Phase 4 is operator-only by design — Cloudflare Pages deploy credentials and screen-reader checks aren't autonomously executable.
- If ZiLin-Dev's cross-repo capability is limited to one repo per `implw` run, the agent will surface a `directive-deviation-suspected` halt at the Phase 3 boundary; the operator then runs `implw` against each of the four child CHOREs the agent files at that point.
- The `zai-examples` repo doesn't currently have a CI workflow per the repo screenshot earlier in this session. Phase 2 doesn't add one. If future work wants to score fixtures automatically on commit, that's a separate FEAT.

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** epic
- **Evaluated at:** 2026-05-15T23:57:23.309Z
- **Score:** 10/10
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| architectural_decision | PASS |
| phases | PASS |
| cross_model_validation | PASS |
| risks_mitigations | PASS |
| escape_hatch | PASS |
| cost_projection | PASS |
| dependencies | PASS |
| tracking_checklist | PASS |
| legal_triggers | PASS |

_Source: 2026-05-09__epic__inline.md_

