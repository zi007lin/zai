# ZiLin Brand Rename — Rationale and Decision Trail

**Status:** Authored 2026-04-19 · Promoted 2026-04-20 during Phase 1 impl
**Authoritative spec:** `issues/2026-04-19__refactor__zilin-brand-migration.md`
**Current location:** `zi007lin/zai/docs/brand/zilin-rename-rationale.md` (moves with the Phase 2 repo rename to `zi007lin/zilin-spec`)

This document is preserved across rollbacks. It captures *why* the decision was made at this date, which has archival value regardless of whether the migration is completed, paused, or reversed.

---

## Trigger

- **Z.ai (Zhipu AI) HK IPO.** January 8, 2026. Public listing accelerates trademark activity in AI and software classes (Nice Classes 9 and 42).
- **Active TM filings by Z.ai.** Ongoing applications in the same classes we operate in.
- **Near-certain collision.** Continued use of "ZAI" as a product brand places any future commercial launch directly in the path of a well-funded TM holder. Cost floor of collision rises with every shipped feature under the old name.

Decision point: **rename now, while the surface area is small**, or **keep and absorb future cease-and-desist exposure**.

**Chosen:** rename now.

## Rejected: keep "ZAI"

| Consideration | Detail |
|---|---|
| Short name, good recognition | True, but indistinguishable from Z.ai at search/trademark level |
| Already in use internally | ~4 weeks of active use; minimal equity accumulated |
| Cost of rename grows with adoption | Yes — and adoption is low enough today that the rename window is open. In 6 months it won't be. |

The "ZAI" brand had roughly one month of lifetime at the point of this decision. No paying customers, no external integrations, no SEO footprint worth preserving. The asymmetry is clear: rename now has a known, bounded cost; keep-and-defend has an uncapped liability.

## Chosen name: ZiLin-\*

**ZiLin** is the founder's 30+ year nickname, given by Igor Mospan circa 1996 (founder was 11). Continuous public and private use since then establishes common-law foundation.

### Why "ZiLin" (not a new invented name)

- **Common-law TM foundation.** 30 years of continuous use predates any modern AI-era TM filings. Priority is defensible on the record.
- **No known tech collisions.** Informal searches of USPTO, trade press, GitHub, and domain registries surface no conflicting product brands.
- **Personal, durable, non-generic.** Not a compound of industry jargon. Distinctive enough to be protectable; not so obscure that it resists adoption.
- **Already in use on `zilinlu.com`** — personal site, operating under the name since well before any AI branding.

### Why a prefix family (not a flat brand)

Decision Tree (from spec):

| Option | Verdict |
|---|---|
| Single flat brand — everything is "ZiLin" | Rejected. Ambiguous when describing multiple products. |
| ZiLin-\* prefix family | **Chosen.** Clear per-product naming; shared brand. |

Family members at this refactor:

- **ZiLin-Spec** — formerly ZAI (validator service, `zai.htu.io` → `zilin-spec.htu.io`)
- **ZiLin-Scheduler** — formerly ZaiVM (scheduler product; greenfield — build under new name from day one)
- **ZiLin-Assistant** — reserved; future user-facing AI layer
- **ZiLin-Coach** — reserved; future consumer helper

Family structure is documented in `zilin-family-namespace.md`.

### Fallback: ZiSpec

If a direct TM conflict surfaces on "ZiLin-Spec" specifically, fall back to **ZiSpec** for the validator piece only. Other family members are unaffected. ZiSpec was the parked prior plan before the family-prefix decision and remains a viable one-off name.

## Decision table (reproduced from spec)

| Question | Options | Chosen | Why |
|---|---|---|---|
| Keep "ZAI" brand | keep / rename | rename | TM collision compounds with time |
| Scope | treat everything as migration / split greenfield vs brownfield | split | Most items are pre-impl; phasing them wastes effort |
| Family structure | flat / prefix family | prefix family | Clear per-product naming |
| Validator name | ZiSpec / ZiLin-Spec / ZiLin-Reviewer | ZiLin-Spec | Unifies under family; ZiSpec is fallback |
| Scheduler name | ZiLinVM / ZiLin-Scheduler / ZiLin-Cron | ZiLin-Scheduler | Semantically accurate; no misleading VM framing |
| Reserved future names | Assistant / Copilot / AIstant / Coach / Helper / Buddy | Assistant + Coach | Standard spellings; no Copilot conflict |
| Cutover for brownfield | big-bang / phased dual-run / lazy | phased dual-run | Live service needs safety net |
| Enterprise disclosure update | defer / fold into this refactor | fold in | Truth-in-advertising fix can't wait |
| Historical references | erase / preserve | preserve | Decision trail has archival value |

## Triggers to revisit

- TM opposition filed against ZiLin, ZiLin-Spec, or ZiLin-Scheduler → escalate; fall back to ZiSpec for the conflicted piece.
- Adoption failure (old URL > 50% of validator traffic at day 35) → extend Phase 1, re-evaluate messaging.
- Technical breakage in Claude Code / `impl` pipeline → pause, repair, then resume.
- A later-discovered ZiLin-\* conflict on a specific name → rename that piece only; others unaffected.

## Clearance plan

**Pre-commercial-launch clearance.** Before any paid/commercial launch of ZiLin-Spec or ZiLin-Scheduler, run a paid USPTO clearance search (approximate cost: USD 500–1,500) in Nice Classes 9 and 42. Phase 1 budget item.

**Common-law fortification.** Optional but advised: obtain a notarized declaration from Igor Mospan documenting the naming event in 1996. Useful if priority is ever contested in a TM opposition proceeding.

## What is NOT renamed

- **StreetTT** — HTU product with independent brand equity. Not a ZiLin-\* family member. Unaffected.
- **HTU, htu.io** — parent brand. Unaffected.
- **zzv.io** — chain/audit brand. Unaffected.
- **HTTC** — separate legal entity operating under DYCD Beacon Agreement #99358B. Unaffected.
- **medicshare, shoplement, NYQEX** — sibling products under HTU. Unaffected.

## Rollback preservation

This document survives any rollback. If the migration reverses, this file is edited (not deleted) to add a "Rollback" section documenting the reversal trigger and date. The archival record of why the decision was considered is preserved regardless of outcome.
