---
spec_type: refactor
rubric_version: 1.2
bundles: []
github_issue: 48
---

# refactor: ZiLin Brand Family Migration

**Spec type:** REFACTOR
**Target:** Narrow runtime migration of ZAI validator + repo + docs; design-time rename for everything else
**Environment policy:** Runtime parts phased (dev → demo → prod, manual promotion); design-time parts applied at next impl of each spec
**Author:** zi007lin
**Approver:** daniel-silvers
**Date:** 2026-04-19
**Depends on:** PR #47 (BUG fix) merged to main and deployed to prod — verified 2026-04-20 at zai.htu.io/app running rubric v1.2.1

---

## Intent

Migrate all product naming from "ZAI" and "ZaiVM" to a unified ZiLin-\* brand family. Trigger: Z.ai (Zhipu AI) HK IPO on January 8, 2026 and ongoing TM filings in AI/software classes make continued "ZAI" use near-certain infringement exposure. ZiLin is a 30+ year founder nickname with common-law foundation and no tech collisions. Most items requiring a rename are pre-impl drafts (design-time rename only, no phasing needed). Only four items are genuinely brownfield runtime migrations requiring phased cutover. Treat those with care; apply the rest by fiat and move on. This is the first REFACTOR spec scored against the newly fixed v1.2.1 validator rubric (9 checks).

## Decision Tree

| Question | Options | Chosen | Why |
|---|---|---|---|
| Keep "ZAI" brand | keep / rename | **rename** | Z.ai TM collision compounds over time; cost floor rises with every shipped feature |
| Scope of migration | treat everything as migration / split greenfield vs brownfield | **split** | Most items are pre-impl; phasing them is theater and wastes effort |
| Family structure | single flat brand / ZiLin-\* prefix family | **prefix family** | Clear per-product naming + shared brand |
| Validator name | ZiSpec / ZiLin-Spec / ZiLin-Reviewer | **ZiLin-Spec** | Unifies prior parked ZiSpec plan under the family; ZiSpec is the fallback if conflict surfaces |
| Scheduler name | ZiLinVM / ZiLin-Scheduler / ZiLin-Cron | **ZiLin-Scheduler** | Semantically accurate; no misleading VM framing |
| Reserved future names | Assistant / Copilot / AIstant / Coach / Helper / Buddy | **Assistant + Coach** | Standard spellings, no typo-fragility, no Copilot conflict |
| Cutover strategy for brownfield | big-bang / phased dual-run / lazy | **phased dual-run** | Live service; need safety net |
| Phase 2 reversibility | assume revertible / treat as one-way | **treat as one-way** | GitHub rename + 301 combination has no native revert; confirmed via GitHub community docs |
| Enterprise disclosure update | defer / fold into this refactor | **fold in** | Truth-in-advertising fix can't wait behind the rename |
| Historical references | erase / preserve | **preserve as history** | Brand docs retain the decision trail |

### Trigger for change

- TM opposition filed against ZiLin, ZiLin-Spec, or ZiLin-Scheduler → escalate; fall back to ZiSpec for the conflicted piece
- Adoption failure (old URL > 50% of validator traffic at day 35) → extend Phase 1 by 30 days before pushing to Phase 2
- Technical breakage in Claude Code / `impl i` pipeline → pause, repair, then resume
- A later-discovered ZiLin-\* conflict on a specific name → rename that piece only (others unaffected)
- Pre-Phase-2 verification (see Migration Plan) fails any check → extend Phase 1, do not cut over

## Final Spec

### Implementation state (authoritative inventory)

Every naming change is either **greenfield** (design-only, no phasing) or **brownfield** (live, phased cutover). Scoping errors here inflate the refactor unnecessarily. See Phase 0 artifacts in `~/dev/streettt-private/drafts/2026-04-19__refactor__zilin-brand-migration/` for pre-staged work.

#### Greenfield — zero migration cost, just adopt new names

| Item | State | Action |
|---|---|---|
| `ZaiVM` → `ZiLin-Scheduler` (the scheduler product) | Draft spec only; no systemd unit deployed; no Contabo user created; no code written | Draft already renamed (completed 2026-04-19). Build with new name at first impl. |
| `zaivm_publish_audit` D1 table → `zilin_scheduler_publish_audit` | No table exists in any D1 | Create with new name at first migration. No data migration. |
| `zaivm:*` KV keys → `zilin-scheduler:*` | No keys written | Use new prefix at first write. |
| `/api/zaivm/*` endpoints → `/api/zilin-scheduler/*` | No handlers implemented | Implement with new paths. |
| `/etc/zaivm/env` → `/etc/zilin-scheduler/env` | File doesn't exist on Contabo | Create with new path at install. |
| `zaivm.service` systemd unit → `zilin-scheduler.service` | Not installed | Install with new name. |
| `ZAIVM_*` env vars → `ZILIN_SCHEDULER_*` | Not configured anywhere | Configure with new names. |
| `docs/zaivm/` → `docs/zilin-scheduler/` | Directory doesn't exist | Create with new name. |
| `zi007lin/zilin-scheduler` repo | Doesn't exist | Create directly with final name. No rename needed. |
| Feature: table weather playability | Draft spec only, no code | Build under ZiLin ecosystem branding from day one. |
| Feature: front-page weather tweet | Draft spec only, no code | Build with ZiLin-Scheduler as publisher from day one. |
| Reserved names: `ZiLin-Assistant`, `ZiLin-Coach` | No implementations, no repos, no domains | Documentary reservation only in `docs/brand/zilin-family-namespace.md`. |
| Three in-flight spec drafts referencing old names | Drafts on disk | Already find-replaced to new names (2026-04-19 as REFACTOR prep). No further action. |

#### Brownfield — real migration work, phased cutover required

| Item | State | Phased action |
|---|---|---|
| ZAI validation service at `zai.htu.io/app` | **Running at rubric v1.2.1 as of 2026-04-20** (PR #47 deployed) | Dual-run → 301 cutover → retire old domain. See Migration Plan. |
| `zi007lin/zai` GitHub repo | Exists with commits, issues, CLAUDE.md, docs | Rename to `zi007lin/zilin-spec` via GitHub's native rename (auto-redirect). Structurally one-way — see Rollback. |
| `ZAI_SYSTEM_INSTRUCTIONS.md` | Active authoritative doc, authored as part of PR #47 | Rename + content update to `ZILIN_SPEC_SYSTEM_INSTRUCTIONS.md`. |
| Marketing copy on `htu.io`, `zzv.io`, validator hero text ("7-section score") | Live public pages with ZAI references | Grep-first, then coordinated update. Hero copy sweep confirmed as Phase 1 work. |

Nothing else is running. **v1.44.0 StreetTT, htu.io, zzv.io, medicshare, shoplement, NYQEX all continue as-is** — none of them are being renamed by this REFACTOR. They're unaffected.

### Authoritative naming table

| Old (if exists) | New | Category |
|---|---|---|
| ZAI | ZiLin-Spec | **Brownfield** service brand |
| zai.htu.io | zilin-spec.htu.io | **Brownfield** domain |
| zi007lin/zai | zi007lin/zilin-spec | **Brownfield** repo |
| ZAI_SYSTEM_INSTRUCTIONS.md | ZILIN_SPEC_SYSTEM_INSTRUCTIONS.md | **Brownfield** doc |
| ZaiVM (draft) | ZiLin-Scheduler | Greenfield |
| All ZaiVM-\* derived names | All ZiLin-Scheduler-\* derived names | Greenfield |
| ZAI Enterprise bundles | ZiLin-Spec Enterprise bundles (with dual-control disclosure footer) | Brownfield content update |

### Reserved names (greenfield, documentary)

- **ZiLin-Assistant** — future user-facing AI layer across medicshare, shoplement, StreetTT admin surfaces
- **ZiLin-Coach** — future consumer helper

Activation of either requires a new SPEC citing this REFACTOR for name provenance. Reservation expires if unused for 24 months (prevents internal squatting).

### Enterprise compliance disclosure

The dual-control pattern (zi007lin as author, daniel-silvers as approver) is process-level — one human principal using two GitHub identities for workflow discipline. It is not principal-level segregation of duties. Enterprise bundles with regulatory SoD requirements attach this mandatory footer (stored in `docs/brand/enterprise-disclosure.md`, referenced by ZiLin-Spec rubric):

> **Dual-control disclosure.** The dual-control segregation in this workflow is process-level (author/reviewer via separate identities for one human principal). Principal-level segregation of duties — two independent human operators — is not yet in place at HTU. Clients with principal-level segregation requirements under HIPAA §164.308, SOX §404, FINRA 3110, or equivalent must arrange for an independent second operator before relying on this control.

### Logo / wordmark

Kitsune fox direction becomes the **ZiLin umbrella mark**. Sub-products use typographic lockups until the Fiverr vector commission returns (~$150–250, parked previously). StreetTT mark (paddle variant) stays as-is — StreetTT is an HTU product with its own brand equity, not a ZiLin-\* family member.

## Acceptance Criteria

Brownfield (phased; verifiable):

- [ ] `zilin-spec.htu.io` serves the full validator, byte-identical to `zai.htu.io` during Phase 1
- [ ] `zai.htu.io` displays the migration banner during Phase 1 (banner HTML pre-drafted in Phase 0)
- [ ] `zai.htu.io` returns HTTP 301 to `zilin-spec.htu.io` from Phase 2 onward
- [ ] `zi007lin/zai` renamed to `zi007lin/zilin-spec` with GitHub auto-redirect verified (clone old URL → resolves to new)
- [ ] `ZAI_SYSTEM_INSTRUCTIONS.md` renamed + any content updates for new brand
- [ ] `docs/brand/zilin-rename-rationale.md`, `docs/brand/zilin-family-namespace.md`, `docs/brand/enterprise-disclosure.md` exist (Phase 0 staging promoted to final locations)
- [ ] Validator hero copy ("7-section score") updated to accurate language given per-type varying rubric counts (currently mismatched after v1.2 fix)
- [ ] Grep of htu.io and zzv.io public content returns zero live "ZAI" references by end of Phase 3 (historical references in `docs/brand/` and `CHANGELOG.md` exempt)
- [ ] Claude Code and `impl i` continue working unchanged throughout all phases
- [ ] Phase 1 extensibility: 30-day extension applied if any TM opposition signal, adoption < 50% at day 35, confidence gap, or pre-Phase-2 verification failure
- [ ] Pre-Phase-2 verification checklist executed (see Migration Plan) — all 5 items PASS before cutover

Greenfield (verified by "built correctly from the start"):

- [ ] At first impl of ZiLin-Scheduler: all new names used (repo, paths, env vars, tables, KV prefix, systemd unit)
- [ ] Reserved names documented with reservation date and 24-month expiry in `docs/brand/zilin-family-namespace.md`

Not applicable (no running code to migrate):

- ~~D1 table migration for zaivm_\* → zilin_scheduler_\*~~ (tables don't exist)
- ~~KV key migration~~ (keys don't exist)
- ~~systemd unit dual-accept~~ (unit not installed)
- ~~Env var dual-accept window~~ (env vars not configured)

## Subject Migration Summary

| Subject | State | From | To | Notes |
|---|---|---|---|---|
| Validator service | Brownfield | ZAI | ZiLin-Spec | Phased domain + repo + docs |
| Validator rubric version | Brownfield | v1.2.1 (current) | v1.3 (post-rename, with Enterprise disclosure) | Bump at Phase 1 |
| Scheduler service | **Greenfield** | (spec only) ZaiVM | (build as) ZiLin-Scheduler | No migration; use new name at impl |
| Table weather playability | **Greenfield** | (spec only) | (spec only) | Brand-neutral, unchanged |
| Front-page tweet | **Greenfield** | (spec only, referenced ZaiVM) | (spec only, references ZiLin-Scheduler) | Draft updated 2026-04-19 |
| Reserved names | Documentary | — | ZiLin-Assistant, ZiLin-Coach | Paper-only reservation |
| Enterprise compliance copy | Brownfield | Implied principal-level | Explicit process-level disclosure | Truth-in-advertising correction |
| Public marketing copy | Brownfield (low surface) | ZAI mentions + "7-section score" hero | ZiLin-Spec mentions + accurate hero language | Grep + update during Phase 1 |
| Validator hero text | Brownfield | "deterministic 7-section score" | Something accurate given per-type counts | Surfaced as follow-up during BUG fix review |
| Memory (Claude's) | Administrative | ZAI/ZaiVM treated as primary | ZiLin-\* family primary, old names historical | Updated 2026-04-19 |
| Claude Code integration | Unaffected | — | — | Paths are user-namespaced, unchanged |
| v2 milestone work | Unaffected | — | — | Runs in parallel; not blocked by this REFACTOR |
| GitHub rename reversibility | Brownfield | Assumed revertible | Treated as one-way structurally | Confirmed via GitHub community docs 2026-04-20 |
| Open questions | — | — | — | (1) ZiSpec fallback triggered if ZiLin-Spec conflict surfaces — accepted. (2) zzv.io stays as the chain/audit brand, not renamed. (3) Commands `impl` / `implw` unchanged. (4) ZiLin-Assistant activation deferred post-v2. (5) StreetTT is not a ZiLin-\* family member; unaffected by this REFACTOR. (6) GitHub Pages site check pre-Phase-2 — verify `zi007lin/zai` does not host Pages; added to pre-cutover verification. |

## Files created / updated

```
Brownfield (actual file changes):
  zi007lin/zilin-spec/                         (renamed from zi007lin/zai at Phase 2)
    README.md                                  (MOD: new brand name, changelog entry)
    docs/
      ZILIN_SPEC_SYSTEM_INSTRUCTIONS.md        (RENAMED from ZAI_SYSTEM_INSTRUCTIONS.md; text updated)
      CHANGELOG.md                             (MOD: v1.3 entry for rename + Enterprise disclosure rubric bump)
      brand/
        zilin-rename-rationale.md              (NEW: Z.ai collision + decision trail — Phase 0 drafted)
        zilin-family-namespace.md              (NEW: reserved names + 24mo expiry — Phase 0 drafted)
        enterprise-disclosure.md               (NEW: dual-control language — Phase 0 drafted)
    src/                                       (MOD: ZAI_* → ZILIN_SPEC_* symbol swap)
    wrangler.toml                              (MOD: env var names; binding names; project-name if needed)
    package.json                               (MOD: name field; deploy script project-name flag)

  htu.io/                                      (MOD if grep finds ZAI refs)
    src/pages/products/zilin-spec.tsx          (NEW or MOD)
    src/pages/About.tsx                        (MOD if needed)

  Validator hero text                          (MOD: replace "deterministic 7-section score" — location TBD Phase 1)

CF DNS:
  Add zilin-spec.htu.io CNAME (Phase 0)
  Add zai.htu.io 301 redirect (Phase 2)

Greenfield (new code born with new names, no "migration"):
  zi007lin/zilin-scheduler/                    (NEW repo, created under final name)

Already completed (REFACTOR prep, no further work needed):
  2026-04-19__spec__zilin-scheduler-v1.md      (renamed from zaivm version)
  2026-04-19__feat__front-page-weather-tweet-v1.md  (in-place updates)
  2026-04-19__feat__table-weather-playability-v1.md (unchanged; no ZaiVM refs)
  userMemories entries #20, #22, #30           (updated 2026-04-19)
  Phase 0 artifacts in ~/dev/streettt-private/drafts/2026-04-19__refactor__zilin-brand-migration/
    - README.md, brand/*, rubric-v1.3-draft.md, migration-banner.html, tabletop-rollback.md, PR-PREP.md
```

## Models Applied

- **#2 Decision Tree** — explicit options/chosen/why table with Trigger for change covering 10 decisions
- **#8 Swiss Cheese (defense in depth)** — layered safeguards *only where they apply*: phased cutover, dual-run window, pre-Phase-2 verification checklist, explicit rollback criteria, 301 preservation, historical reference preservation. Not applied to greenfield items (layering defenses over paper is waste).
- **#11 Progressive Disclosure** — brownfield migration reveals in phases with measurable gates (Phase 0 prep → Phase 1 dual-run → Phase 2 cutover → Phase 3 retire); greenfield items skip phasing entirely because there's nothing to disclose progressively
- **#13 OODA Loop** — rollback criteria map Observation (adoption metrics, TM signals, breakage, pre-cutover checks) → Orientation (phase review) → Decision (continue / extend Phase 1 / rollback) → Action (procedure per phase)
- **#15 Inversion / Premortem** — central application: inversion asked "what would make this rename fail or waste effort?" and the answer was *treating greenfield items as if they were brownfield*. This REFACTOR's structure is the direct output of that inversion. Second inversion: "what makes Phase 2 irreversible?" — yielded the GitHub rename one-way gate analysis, added to rollback section

## Migration Plan

### Design-time renames (greenfield) — instant, no phasing

No plan needed. Every spec in the `issues/` directory that references old names was find-replaced on 2026-04-19 during REFACTOR prep. New specs are drafted under new names from day one. No further action until first impl of the affected specs.

### Runtime migration (brownfield) — phased

**Phase 0 — Prep (Days 0–7):**
1. Merge this REFACTOR spec after dual-control review
2. Create `zi007lin/zilin-spec` placeholder repo (absorbs rename in Phase 2)
3. Create `zi007lin/zilin-scheduler` placeholder repo (greenfield, just exists)
4. CF DNS: add `zilin-spec.htu.io` CNAME to same CF Pages project as `zai.htu.io`
5. Deploy migration banner to `zai.htu.io` (HTML pre-drafted in Phase 0 staging)
6. Publish rubric v1.3 with Enterprise disclosure footer (draft pre-authored)
7. Tabletop rollback walkthrough (simulated, not executed) — completed in Phase 0 staging

**Phase 1 — Dual-run (Days 8–37, 30 days):**
8. Both domains live; banner on old
9. Rubric v1.3 published; new scored specs carry the Enterprise disclosure
10. Documentation + public marketing copy updated to new names
11. Validator hero text updated to accurate language
12. Weekly: measure traffic split; health check both domains
13. Decision gate at day 35: advance to Phase 2 only if adoption ≥ 50% and no TM opposition signals; otherwise extend Phase 1 by 30 days

**Pre-Phase-2 verification checklist (all 5 must PASS):**
1. `gh api repos/zi007lin/zai/pages` returns 404 — confirms no GitHub Pages site (Pages URLs are not auto-redirected by GitHub rename)
2. Traffic split: `zilin-spec.htu.io` ≥ 50% of validator requests over trailing 7 days
3. No active TM opposition filings against ZiLin, ZiLin-Spec, or ZiLin-Scheduler
4. Claude Code `impl i` pipeline verified working against new domain
5. Banner displayed and dismissable; no user complaints

**Phase 2 — Cutover (Day 38):** ⚠ Structurally one-way; plan for no-rollback
14. `zai.htu.io` → HTTP 301 to `zilin-spec.htu.io` via CF Pages custom domain routing
15. `zi007lin/zai` renamed on GitHub → `zi007lin/zilin-spec` (≥ 7 days notice posted beforehand)
16. Banner removed from the now-redirecting old domain
17. **Post-cutover NEVER create a new repo named `zi007lin/zai`** — doing so permanently breaks the auto-redirect

**Phase 3 — Retire (Days 39–98, +60 days):**
18. Final documentation sweep; any last ZAI mentions in non-brand docs removed
19. Close REFACTOR issue; brand migration complete

### Rollback

**Rollback triggers:** TM opposition filed; Phase 1 adoption below 50% at day 35; unrepairable technical breakage; discovery of a later conflict on a specific ZiLin-\* name; pre-Phase-2 verification checklist failure.

**Phase 0 rollback** (near-zero cost): delete placeholder repos, remove DNS CNAME, revert memory edits, discard Phase 0 artifacts in drafts/.

**Phase 1 rollback** (low cost): remove `zilin-spec.htu.io` CNAME, revert docs PR, revert rubric v1.3, traffic returns to `zai.htu.io`. No data impact (no data was migrated). All staged Phase 0 artifacts preserved for potential re-launch.

**Phase 2 rollback — structurally degraded; treat as no-rollback:**

Per GitHub docs and community confirmation: repo rename redirects persist indefinitely but break permanently the moment a repo with the old name is created at the old location. There is no native revert after Phase 2. "Rollback" means one of:

- **Option A (accepted):** accept `zi007lin/zilin-spec` as permanent canonical and do not attempt to restore old-name access. Cost: zero; externally-linked content unaffected.
- **Option B (high cost):** forward-rename `zi007lin/zilin-spec` to a third recovery name (e.g. `zi007lin/zilin-spec-v2`). Every external reference written during dual-run must be manually updated or will 404. Cost: 3–7 days of sweep work scaling with link count.

Creating a new `zi007lin/zai` repo to "restore" the old name is a **sabotage action** — it permanently breaks the auto-redirect for all links ever written. Never do this under any rollback scenario.

**Practical implication:** Phase 2 is effectively a one-way gate. Extend Phase 1 aggressively if any rollback signal surfaces; Phase 1 is fully reversible. Do not push into Phase 2 on a wing and a prayer.

**Phase 3 rollback** (high cost, survivable — but note Phase 2 damage is already done): re-enable old marketing copy, restore old doc names, communicate reversal to any Enterprise clients who onboarded under the new brand. No data corruption possible (the REFACTOR never touched runtime data). Rename path follows Phase 2 Option A or B above.

**Non-rollback always preserved:** `docs/brand/zilin-rename-rationale.md` and the decision trail survive any rollback — they capture *why* the decision was made at this date, which has archival value regardless of outcome.

**Greenfield items have no rollback concept.** If ZiLin-Scheduler later proves to need a different name, that's a new REFACTOR against the greenfield-built system, not a rollback of this one.

## Legal triggers

- **Trademark avoidance.** Central purpose of the refactor. Z.ai (Zhipu AI) HK IPO January 8, 2026; active filings in AI/software classes. ZiLin-\* family is the selected safer alternative. Documented in `docs/brand/zilin-rename-rationale.md`.
- **Common-law TM foundation.** Founder has used "ZiLin" continuously since ~1996 (age 11, given by Igor Mospan). Continuous use establishes common-law rights. Optional fortification: notarized declaration from Igor Mospan documenting the naming event, useful if priority is ever contested.
- **Pre-commercial-launch clearance.** Before any paid/commercial launch of ZiLin-Spec or ZiLin-Scheduler, run a paid USPTO clearance search (~$500–1500) in Nice Classes 9 and 42. Phase 1 budget item.
- **Enterprise compliance disclosure correction.** Prior ZAI Enterprise bundles implied principal-level segregation of duties. This refactor corrects to process-level via mandatory footer. Truth-in-advertising control.
- **Domain redirect preserves link equity.** 301 is authoritative for search engines; inbound SEO transfers cleanly from old to new domain.
- **GitHub repo rename is structurally one-way.** Documented in Rollback section. Phase 2 decision carries higher weight than typical phased cutovers; Phase 1 extensibility criteria reflect this.
- **Reserved names create internal precedence, not public rights.** Rights accrue on use. Reservation documented with 24-month expiry prevents internal squatting.
- **No change to Beacon / HTTC compliance.** HTTC operates under DYCD Beacon Agreement #99358B; HTTC is unaffected by this refactor. StreetTT and HTTC remain separate legal entities.
- **No change to third-party licenses** (Open-Meteo CC-BY in weather specs, etc.) beyond what originating specs already specify.
- Keyword sweep (contract, indemnify, PHI, PAN, royalty): no new triggers beyond the items above.

---

**Pipeline:** download `-v1.md` → upload to `zai.htu.io/app` (now running rubric v1.2.1 post BUG fix, will correctly classify as refactor) → receive `-v1.scored.md` → then run:

```bash
cp "/mnt/c/Users/zilin/Downloads/2026-04-19__refactor__zilin-brand-migration-v1.scored.md" \
   "$HOME/dev/zai/issues/2026-04-19__refactor__zilin-brand-migration.md"
impl i /mnt/c/Users/zilin/Downloads/2026-04-19__refactor__zilin-brand-migration-v1.scored.md
```

Optional cross-ref pointer (per governance pattern):

```bash
echo "Authoritative: zi007lin/zai (to be zi007lin/zilin-spec) — issue TBD on impl" \
  > "$HOME/dev/streettt-private/issues/_refs/2026-04-19__refactor__zilin-brand-migration.md"
```

---

## ZAI Spec Score

- **Rubric version:** 1.2.1
- **Spec type:** refactor
- **Evaluated at:** 2026-04-20T05:53:03.603Z
- **Score:** 9/9
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| decision_tree | PASS |
| final_spec | PASS |
| acceptance_criteria | PASS |
| migration_summary | PASS |
| files_list | PASS |
| models_applied | PASS |
| migration_plan | PASS |
| legal_triggers | PASS |

_Source: 2026-04-19__refactor__zilin-brand-migration-v1.md_
