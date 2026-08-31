# BUG: Deployed ZAI authoring templates do not match the live rubric

## Intent

The deployed ZAI authoring surface is inconsistent with its authoritative live rubric. Its only downloadable template is an incomplete FEAT skeleton that scores 7/10, and it offers no BUG skeleton despite an eight-check BUG rubric. Correct the authoring surface and establish deterministic synchronization so a deployed canonical template passes its corresponding live rubric without authors discovering omitted requirements through failed submissions.

## Repro

### Preconditions

Use any deployed environment at commit `9428dd7`:

- `https://dev.zai.htu.io/app`
- `https://demo.zai.htu.io/app`
- `https://zai.htu.io/app`

The environments expose identical assets and rubric version 1.5.0.

### Case 1 — Downloaded FEAT template is incomplete

1. Select **Download template**.
2. Save the returned `spec-template.md` under its instructed canonical FEAT filename pattern, such as `2026-08-31__feat__live-template.md`.
3. Upload that unchanged template to the deployed scorer.

Expected: a canonical template supplied by ZAI contains every required FEAT section and is structurally eligible to pass once placeholders are replaced with substantive content.

Actual: the unchanged live template scores 7/10. It omits three required headings:

- `## Models Applied`
- `## Legal Triggers`
- `## Work Estimate`

The scorer correctly reports all three failures.

### Case 2 — BUG skeleton is absent

1. Open the deployed authoring/scoring surface.
2. Attempt to obtain a BUG skeleton corresponding to `GET /api/v1/rubric/bug`.

Expected: ZAI provides a BUG authoring skeleton containing, in canonical order, Intent, Repro, Fix, Acceptance Criteria, Subject Migration Summary, Files, Legal triggers, and Work Estimate.

Actual: no BUG-specific template, skeleton selector, or deployed draft endpoint exists. The sole download always returns the incomplete FEAT template.

### Control evidence

- A valid BUG built from the live rubric scores 8/8 PASS in DEV, DEMO, and PROD.
- A valid FEAT built from the live rubric scores 10/10 PASS in DEV, DEMO, and PROD.
- Removing only `## Legal Triggers` from the BUG yields 7/8 with the correct missing-heading diagnostic.
- All three environments serve identical HTML, JavaScript, CSS, rubric payloads, and scoring behavior.

This proves a shared authoring-surface defect, not scoring failure or deployment drift.

## Fix

### Layer 1 — Type-aware canonical templates

Replace the single unconditional `SPEC_TEMPLATE` download with a type-aware template surface. At minimum, provide canonical FEAT and BUG skeletons whose headings and order correspond to their live rubric contracts.

The FEAT template must cover all ten live checks. The BUG template must cover all eight live checks. Placeholder content must explain structural requirements without using artificial pass-only text.

### Layer 2 — Deterministic rubric synchronization

Generate template section structure from the same authoritative rubric metadata used by scoring, or introduce a typed template definition that is mechanically validated against `SECTIONS_BY_TYPE`. A new required rubric check must cause CI to fail until every affected deployed template is updated.

Human-friendly instructions and subsection content may remain template-specific, but required section keys, canonical headings, order, and counts must not drift independently.

### Layer 3 — Deployed authoring UX

Allow the author to select the intended spec type before downloading a template. The downloaded filename and H1 should support deterministic type detection. Do not present a generic template as canonical for a type it cannot satisfy.

### Layer 4 — Regression coverage

Add tests that:

1. enumerate every template exposed by the deployed UI;
2. compare its required section keys and order with the live rubric;
3. fill placeholders with minimal substantive content and confirm PASS;
4. prove FEAT contains 10/10 required sections;
5. prove BUG contains 8/8 required sections; and
6. verify the download action returns the selected type's template and canonical filename.

The `/api/health` and `/api/env` routing behavior is explicitly out of scope.

## Acceptance Criteria

- [ ] The deployed authoring UI provides distinct FEAT and BUG template choices.
- [ ] The deployed FEAT template includes all 10 required rubric sections in canonical order, including Models Applied, Legal Triggers, and Work Estimate.
- [ ] The deployed BUG template includes all 8 required rubric sections in canonical order.
- [ ] A substantively completed document created strictly from each deployed template scores PASS against the same environment's live rubric.
- [ ] Template section keys, headings, ordering, and counts are generated from or mechanically checked against the authoritative live rubric so future drift fails CI.
- [ ] DEV, DEMO, and PROD smoke checks confirm identical template, rubric, scoring, and canonical-artifact behavior after deployment.
- [ ] No scoring rule or rubric definition is weakened to make a template pass.
- [ ] `/api/health` and `/api/env` behavior remains outside this change.

## Subject Migration Summary

| Subject | From | To |
|---|---|---|
| FEAT template | One hard-coded 7/10 skeleton | Canonical 10/10 structure synchronized with the live FEAT rubric |
| BUG template | Absent | Canonical 8/8 structure synchronized with the live BUG rubric |
| Template selection | One unconditional generic download | Explicit spec-type selection with canonical filename and H1 |
| Drift prevention | Template and rubric evolve independently | CI-enforced or generated synchronization from one authoritative contract |
| Open questions | Whether every scored type needs a template in this BUG | FEAT and BUG are mandatory; architecture must safely support adding remaining types without another parallel hard-coded system |

## Files

```
src/lib/specTemplate.ts
src/lib/specTemplate.test.ts
src/pages/AppPage.tsx
src/components/UploadZone.tsx
src/components/UploadZone.test.tsx
src/lib/scoreSpec.ts
```

## Legal Triggers

None. This is an internal authoring, validation-consistency, and user-interface defect. It introduces no contract, license, PHI, PAN, liability, or compensation terms.

## Work Estimate

### Active operator time

| Phase | Estimate |
|---|---:|
| Design type-aware synchronized template contract | 45 minutes |
| Implement FEAT and BUG templates and selection UX | 90 minutes |
| Add rubric-drift and download regression tests | 75 minutes |
| Validate build and three-environment smoke | 30 minutes |
| Total | 4 hours |

### Wall-clock time

| Wait dependency | Estimate |
|---|---:|
| Review, CI, deployment, and parity smoke | 1–3 days |
| Total | 1–3 days |

### Assumptions

- The live `SECTIONS_BY_TYPE` contract remains authoritative.
- FEAT and BUG are the required remediation scope; additional type templates may be delivered only when the synchronization architecture makes them low-risk.
- Health and environment routes remain separately governed concerns.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---:|---:|---:|
| Template contract | 45 minutes | TBD | TBD |
| Templates and UX | 90 minutes | TBD | TBD |
| Tests | 75 minutes | TBD | TBD |
| Deployment smoke | 30 minutes | TBD | TBD |
| Total | 4 hours | TBD | TBD |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** bug
- **Evaluated at:** 2026-08-31T04:44:25.971Z
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

## Provenance (auto-materialized)

- **Source issue:** https://github.com/zi007lin/zai/issues/126
- **Acquisition:** inline-scored issue body
- **Materialized at:** 2026-08-31

