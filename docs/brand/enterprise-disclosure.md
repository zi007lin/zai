# Enterprise Compliance — Dual-Control Disclosure

**Status:** Authored 2026-04-19 · Promoted 2026-04-20 during Phase 1 impl
**Authoritative spec:** `issues/2026-04-19__refactor__zilin-brand-migration.md`
**Current location:** `zi007lin/zai/docs/brand/enterprise-disclosure.md` (moves with the Phase 2 repo rename to `zi007lin/zilin-spec`)
**Referenced by:** ZiLin-Spec rubric v1.3 (mandatory footer on specs carrying triggered bundles — see `src/lib/scoreSpec.ts`)

This document is a truth-in-advertising correction. Prior ZAI Enterprise bundle messaging implied principal-level segregation of duties. The dual-control in the HTU workflow is process-level (one human operating two identities), not principal-level (two independent humans). Enterprise clients with regulatory requirements under HIPAA, SOX, FINRA, or equivalent must not rely on the HTU workflow alone for the principal-level control. This document states that plainly.

---

## Disclosure text (canonical)

The following text is the canonical disclosure. Rubric v1.3 injects this text (verbatim) as a footer on any scored spec carrying a bundle in the trigger list.

> **Dual-control disclosure.** The dual-control segregation in this workflow is process-level (author/reviewer via separate identities for one human principal). Principal-level segregation of duties — two independent human operators — is not yet in place at HTU. Clients with principal-level segregation requirements under HIPAA §164.308, SOX §404, FINRA 3110, or equivalent must arrange for an independent second operator before relying on this control.

## Trigger bundles

The disclosure is mandatory on any spec whose frontmatter `bundles:` array contains one or more of:

| Bundle | Domain |
|---|---|
| `healthcare` | HIPAA §164.308 administrative safeguards; PHI handling |
| `fintech` | SOX §404; financial reporting controls |
| `financial_advisory` | FINRA 3110 supervision; investment advice workflow |
| `legal_services` | Model Rules; conflict-of-interest segregation |
| `government` | FedRAMP / NIST 800-53 SC-7 separation of duties |

A spec carrying any of the trigger bundles receives the footer, regardless of spec type (chore, feat, refactor, bug, research, hotfix).

A spec carrying none of the trigger bundles does not receive the footer. The disclosure is not meant to be universal — it is specifically about bundles that invoke principal-level segregation requirements.

## What the disclosure does and does not mean

### What it means

- HTU currently has **one human principal** operating under two identities (`zi007lin` authors, `daniel-silvers` reviews and merges).
- This is **process-level segregation**: a single human operator cannot bypass the two-step workflow for their own commits without creating a visible audit record.
- It is useful as an integrity control. A malicious or compromised author cannot single-step a change into production; the merge step requires the reviewer identity.

### What it does not mean

- It is **not** principal-level segregation. HIPAA §164.308(a)(3)(ii)(A), SOX §404 ICFR, FINRA 3110, and equivalent standards contemplate two *independent human operators*, not one human with two roles.
- A client whose compliance regime requires the principal-level interpretation cannot rely on the HTU workflow alone to satisfy the control. They must arrange for a second, independent human operator — either by joining the HTU team as such or by reviewing changes through their own independent identity before the change enters their production scope.
- The disclosure is not a warranty. It is a statement of fact about the current operational state of HTU. The state may change (e.g., if a second principal joins), in which case this document is updated in the same PR that establishes the new state.

## Activation conditions for principal-level control

This disclosure exits the mandatory footer when all of the following are true:

1. A second human principal has joined HTU in the reviewer role.
2. The second principal is operationally independent of the first (separate employment, separate access, no common beneficial ownership in a way that would defeat segregation).
3. The change from process-level to principal-level is documented in a new spec that supersedes the relevant sections of this file.
4. Rubric is bumped to a new version that removes the footer trigger for the relevant bundles.

Until then, the footer is mandatory on all triggered bundles.

## Relationship to Gate 1 solo-operator path

CLAUDE.md Hard Rules describe a "solo-operator path" for Gate 1 (spec approval) where ZiLin acts as both author and reviewer. The solo-operator path is a **self-applied exception** to the team-scale approval hold — it is explicitly not a claim of principal-level segregation. The PR review at merge remains the enforceable dual-control gate, and that gate is process-level under the current operational state.

The enterprise disclosure footer reflects this accurately: the "dual-control segregation" it describes is exactly the process-level control that remains in force during solo-operator sessions.

## Rollback preservation

This document survives any rollback of the ZiLin Brand Migration REFACTOR. The disclosure language is the truth-in-advertising correction regardless of what the service is named. If the rename is reversed, this file remains; only its filename or frontmatter product-name references are updated.

## Document review

| Reviewer | Role | Concern |
|---|---|---|
| Legal counsel (future) | Verify language does not over- or under-state the control | Pre-commercial-launch review |
| Daniel Silvers (founder) | Approve disclosure as accurate characterization of HTU state | 2026-04-19 REFACTOR review |
| Enterprise customer (future) | Confirm disclosure is clear enough to guide their compliance-officer review | First enterprise engagement |
