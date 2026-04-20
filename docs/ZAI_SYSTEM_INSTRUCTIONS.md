# ZAI SYSTEM INSTRUCTIONS

**Version:** 1.2 (2026-04-19)
**ZAI:** the structural validation service running at `zai.htu.io/app`
**Purpose:** authoritative spec for what ZAI validates, how it scores, and how humans interact with it
**Canonical location:** `docs/ZAI_SYSTEM_INSTRUCTIONS.md` in `zi007lin/zai`

---

## 1) What ZAI is

ZAI is a **structural validation and scoring layer** between a human spec author and the downstream implementation pipeline (ZiLin-dev / Claude Code). ZAI's job is narrow:

- Validates structural compliance against per-type rubrics (FEAT / BUG / SPEC / CHORE / REFACTOR / RESEARCH / UX / BRAND)
- Detects thinking-model usage and cross-checks against declaration
- Validates Legal triggers subsection completeness (NOT legal judgment)
- Scores on 0–N scale where N is the required check count for that type
- Displays which models were invoked and how each contributed
- Emits `.scored.md` artifact upon full pass — the forcing function
- Optionally applies Enterprise industry bundles

ZAI does NOT validate:
- Substance (is this the correct thing to build?)
- Domain correctness (does this solve the real problem?)
- Implementability (will the code work?)
- Business alignment (should this be built at all?)
- Legal correctness (is this clause enforceable?) — **explicitly non-goal**

---

## 2) Rubrics by spec type

Each spec type has a base rubric. Items are binary PASS/FAIL. Score = PASS count.

### FEAT / FEATURE rubric (9 checks)

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | `## Intent` H2, ≤150 tokens (hyphen-split) |
| 2 | Decision Tree | `## Decision Tree` H2 + markdown table + `### Trigger for change` subsection |
| 3 | Final Spec | `## Final Spec` H2 present |
| 4 | Acceptance Criteria | `## Acceptance Criteria` H2 with checkbox list |
| 5 | Game Theory review | `## Game Theory Cooperative Model review` H2 + `### Abuse vector` subsection |
| 6 | Subject Migration Summary | `## Subject Migration Summary` H2 with table + `Open questions` row; no `**bold**` first-column labels |
| 7 | Files created / updated | `## Files created / updated` H2 with fenced code block |
| 8 | Models Applied | `## Models Applied` H2 declaring required models + structural evidence matches |
| 9 | Legal triggers | `## Legal triggers` H2 present, declares "None" or lists specific triggers |

**Optional (scored separately, do not block pass):**
- `## Draft-of-thoughts` — +1 "process quality" badge
- Appendices — +1 "completeness" badge

### BUG / HOTFIX rubric (7 checks)

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | `## Intent` H2, ≤150 tokens |
| 2 | Repro | `## Repro` H2 + Preconditions / Steps / Expected / Actual / Root cause |
| 3 | Fix | `## Fix` H2, layered (`### Layer 1 — ...`) |
| 4 | Acceptance Criteria | `## Acceptance Criteria` H2 |
| 5 | Subject Migration Summary | Same as FEAT item 6 |
| 6 | Files | `## Files` H2 with fenced code block |
| 7 | Legal triggers | `## Legal triggers` H2 present |

### SPEC rubric (6 checks)

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | ≤150 tokens |
| 2 | Decision Tree | Table + Trigger for change |
| 3 | Rules or content | `## Rules` / `## Content` / domain H2 |
| 4 | Subject Migration Summary | Standard |
| 5 | Files / Schema | With fenced code block |
| 6 | Legal triggers | Required |

### CHORE rubric (5 checks)

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | ≤100 tokens |
| 2 | Action | `## Action` H2 with numbered steps |
| 3 | Acceptance Criteria | Standard |
| 4 | Files | Standard |
| 5 | Legal triggers | Required |

### REFACTOR rubric (9 checks)

FEAT minus Game Theory, plus `## Migration Plan` with rollback procedure. Legal triggers inherited from FEAT base (not a separate addition).

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | `## Intent` H2, ≤150 tokens |
| 2 | Decision Tree | `## Decision Tree` H2 + table + `### Trigger for change` subsection |
| 3 | Final Spec | `## Final Spec` H2 present |
| 4 | Acceptance Criteria | `## Acceptance Criteria` H2 with checkbox list |
| 5 | Subject Migration Summary | `## Subject Migration Summary` H2 with table + `Open questions` row |
| 6 | Files created / updated | `## Files created / updated` H2 with fenced code block |
| 7 | Models Applied | `## Models Applied` H2 declaring required models + structural evidence |
| 8 | Migration Plan | `## Migration Plan` H2 with phased steps + `### Rollback` subsection including explicit triggers |
| 9 | Legal triggers | `## Legal triggers` H2 present |

### RESEARCH rubric (6 checks, inherited from v1.1 unchanged)

Research specs produce decision-ready reports; they do not ship code, so Legal triggers is not a required section (reports are non-building by definition). RESEARCH stayed at 6 checks in v1.2.

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | `## Intent` H2, ≤150 tokens |
| 2 | Research Questions | `## Research Questions` H2 with numbered list |
| 3 | Acceptance Criteria | `## Acceptance Criteria` H2 defining "report is complete when…" |
| 4 | Report Format | `## Report Format` H2 describing output structure |
| 5 | Subject Migration Summary | Standard |
| 6 | Files | `## Files` H2 with fenced code block |

### UX / BRAND rubric (6 checks)

| # | Check | Pattern |
|---|---|---|
| 1 | Intent | ≤150 tokens |
| 2 | User Jobs | `## Jobs To Be Done` H2 with 3–5 jobs |
| 3 | Design Rationale | `## Design Rationale` H2 including `### Interaction of Color` |
| 4 | Acceptance Criteria | Standard |
| 5 | Assets / Files | With fenced code block |
| 6 | Legal triggers | Required |

---

## 3) Model detection and cross-check

Two-pass detection with cross-check.

**Pass A — Declaration detection:** parses `## Models Applied` section.

**Pass B — Structural evidence detection:** scans for structural signals per model.

| Model | Structural signal |
|---|---|
| #1 Game Theory Cooperative | `Abuse vector` subsection OR cooperation framing |
| #2 Decision Tree | Markdown table with "Options", "Chosen", "Why" columns + Trigger for change |
| #3 Draft-of-thoughts | `## Draft-of-thoughts` section present |
| #4 Systems Thinking | Diagram of loops OR "leverage point" language |
| #5 Flywheel | "friction", "acceleration", "compound" with cause-effect chain |
| #6 Ostrom's Commons | "governance", "shared resource" with tiered principles |
| #7 Network Effects | Metcalfe reference OR "density", "depth before breadth" |
| #8 Swiss Cheese | ≥2 defense layers enumerated |
| #9 Jobs To Be Done | 3–5 user jobs explicit |
| #10 Anti-Fragile | "stress", "redundancy makes stronger" framing |
| #11 Progressive Disclosure | Staged rollout OR complexity-gating |
| #12 Event Sourcing + CQRS | Event log OR derived-state architecture |
| #13 OODA Loop | Observe/Orient/Decide/Act framing |
| #14 SIX PASS Validation | SIX PASS section OR 6-gate exit |
| #15 Inversion / Premortem | `Inversion` subsection OR sabotage/failure-guarantee language |
| #16 Mechanism Design | "truthful reporting", "dominant strategy", "incentive-compatible" |
| Interaction of Color (scope-restricted) | UX/BRAND specs only; "color relations", "contrast pairs", "palette system" |

**Pass C — Cross-check:**
- ✅ GREEN: declared + detected
- ⚠ YELLOW: declared-not-detected OR detected-not-declared (informative)
- ✗ RED: required + missing (fails the Models Applied rubric check — FEAT #8, REFACTOR #7)

### Legal triggers detection

ZAI validates presence + completeness of the `## Legal triggers` subsection. It does not assess whether declared triggers are legally correct.

Keyword scan: if the spec body contains keywords suggesting triggers (contract, license, indemnify, PHI, PAN, liability, royalty, compensation, arbitration, etc.) but the Legal triggers section declares "None", ZAI issues a YELLOW warning asking the author to review. Does not fail the spec.

---

## 4) Scoring display

### Top section

Score badge + spec type + pass/fail state + failure count.

### Per-check bars

Horizontal bars (green=PASS, red=FAIL) with check names and specific error messages on FAIL.

### Models panel

Dedicated section below rubric bars:

```
MODELS APPLIED

✅ #1  Game Theory Cooperative        declared + detected
✅ #2  Decision Tree                  declared + detected
⚠  #4  Systems Thinking               declared, not detected — review
✅ #15 Inversion / Premortem          declared + detected
✅ #16 Mechanism Design               declared + detected

NOT APPLIED (click to expand)
```

Clicking any badge expands rationale + signals searched + signals found.

### Legal triggers panel

```
LEGAL TRIGGERS DECLARED

Declared: None
⚠ Warning: spec body contains "contract", "indemnify" keywords.
  Review whether triggers #1 or #3 should be declared.
  This does not block pass.
```

### Compliance panel (Enterprise bundles only)

If bundles selected at submission:

```
COMPLIANCE — HEALTHCARE (HIPAA)
✅ PHI-handling declaration
✅ BAA coverage statement
⚠  Audit-trail requirement — present but weak
```

### Footer

```
<filename> · Scored 2026-04-19T17:23:01.812Z · rubric v1.3.0 · bundles: [healthcare]
[Download scored spec ↓]  [Run impl →]
```

`Run impl →` disabled on any FAIL.

---

## 5) Tool tiers — how humans generate specs

ZAI structural validation is free at every tier. Tiers sell assistance in getting to a pass.

### Model access model (applies to all tiers using AI features)

| Layer | Models used | Who pays | Privacy |
|---|---|---|---|
| Default | Cloudflare Workers AI free tier (Llama 3, Mistral, etc.) | ZAI absorbs | Standard CF Workers AI TOS |
| BYOK (Assist+) | User provides own API key | User pays provider directly | AES-256-GCM encrypted in D1; responses never logged |
| ZAI system instructions | Internal detection heuristics | Internal | **Proprietary, not public, not user-viewable** |

BYOK privacy guarantees:
1. API key AES-256-GCM encrypted at rest
2. AI responses not logged (except anonymized usage counters for billing)
3. Key deletion immediate and propagating
4. ZAI system prompts never exposed via API responses

### Tier 1 — DIY / Free

- Tool: `zai.htu.io/app`
- User writes spec themselves
- Iteration via -v2, -v3 re-uploads
- No AI assistance with substance
- Price: free
- SLA: 5-second score latency

### Tier 2 — ZAI Assist

- Tool: `zai.htu.io/draft` (in-browser drafter)
- AI-assisted drafting; continuous checks during writing
- Cloudflare default models OR BYOK
- Price: metered per session OR monthly subscription (per contract)
- SLA: 5-second score latency

### Tier 3 — ZAI Pro

- Human + AI service
- Flow: problem description → ZiLin research report → user input → ZiLin drafts spec with models applied by hand → Assist final pass → submission
- Deliverable: validated spec + research report + 1 revision
- Price: per-spec flat fee (per contract)
- SLA: 48-hour first draft

### Tier 4 — ZAI Enterprise

- Pro + industry bundles (§6) + dedicated consultation
- Custom per-client rubrics on request
- Recurring ZiLin consultation (weekly/biweekly)
- BYOK encouraged; on-premise / air-gapped for regulated clients
- Price: retainer + bundle fees + optional per-spec (per contract)
- SLA: 24-hour turnaround, priority queue

---

## 6) Enterprise industry bundles

Bundles add compliance-specific rubric checks on top of the base type rubric. Stackable.

### Bundle catalog

| Bundle | Attribution | Added checks (summary) | Typical clients |
|---|---|---|---|
| healthcare | HIPAA + HITECH | PHI handling, BAA coverage, audit trail, de-identification, breach notification | medicshare, telehealth |
| fintech | SOX §404 + PCI-DSS v4.0 | Internal controls, PCI scope, PAN not logged, change mgmt, segregation of duties | NYQEX, payments |
| financial_advisory | FINRA + SEC | Advice disclaimer, fiduciary duty, suitability, Rule 17a-4, Rule 2210 | RIA, robo-advisors |
| education | FERPA | Student PII, parental consent, directory opt-out, retention, annual notification | LMS, tutoring |
| gdpr | EU + UK GDPR | Lawful basis, minimization, DPIA, DSR, DPO, cross-border transfer | International SaaS |
| ccpa | CA CCPA/CPRA | Consumer rights, opt-out, sensitive PI, retention, GPC signal | CA-operating |
| coppa | Children's privacy | Under-13 detection, verifiable consent, minimization, safe harbor | HTTC youth |
| accessibility | WCAG 2.2 AA + ADA | Semantic HTML, keyboard nav, screen reader, contrast, focus, reduced motion | All public-facing (baseline) |
| government | FedRAMP + NIST 800-53 | Boundary, control mapping, continuous monitoring, IR plan, FIPS 140-3 | Public sector |
| insurance | NAIC + state | Licensing, replacement disclosure, suitability, producer recordkeeping | Insurtech, C2C broker |
| transportation | DOT + FMCSA | DQ file, HOS, inspection records, drug/alcohol, ELD | Logistics, fleet |
| beacon_program | DYCD Beacon | Zero fees attestation, content gate, incident reporting, background check, consent chain, capacity | HTTC, youth |
| contract_law_signals | Contract structure (NOT legal advice) | Required clauses present, structural red flags, jurisdiction declared, attorney review attested | HTU.io C2C, any contract-handling |
| legal_services (future) | Partner law firm specs | Model Rule 5.4 compliance, UPL boundary, attorney-client disclaimers, BAA if applicable | HTU.io panel firms (2027+) |

**`contract_law_signals` mandatory disclaimer banner on output:**

> "This structural check does not constitute legal advice. Consult a licensed attorney in the governing jurisdiction before signing or acting on this document. HTU.io is not a law firm."

Bundle is jurisdiction-agnostic. Does NOT render enforceability opinions.

### Adding a new bundle

1. SPEC issue in `zi007lin/zai/issues/`
2. Industry-domain expert review
3. Legal review if encoding regulatory requirements
4. Approver sign-off
5. Announce to Enterprise clients with 30-day comment period
6. Activate in rubric registry

---

## 7) Accessibility default

WCAG 2.2 AA applies to every public-facing feature regardless of bundle selection. The `accessibility` bundle extends, does not replace the baseline.

---

## 8) Segregation of duties

| Layer | Validates |
|---|---|
| ZAI | Structure, rubric checks, model declaration + detection cross-check, bundle compliance, legal-triggers completeness |
| Human author | Substance, domain correctness, cooperative-model reasoning applied soundly |
| Approver | Business alignment, governance compliance, merge authority |
| ZiLin-dev / Claude Code | Implementability, code-spec alignment, test pass, governance |
| Counsel (2027+) | Legal correctness of flagged specs in queue |

ZiLin-dev does NOT re-validate models or legal triggers. Contradictions raise `needs_input` — that's a new finding, not re-validation.

**Operator reality disclosure:** the current dual-control pattern (zi007lin as author, daniel-silvers as approver) is process-level dual-control using two GitHub identities for one human principal. It is not principal-level segregation of duties. Enterprise bundles with regulatory SoD requirements (healthcare §164.308, fintech SOX §404, financial_advisory FINRA 3110, government NIST 800-53 AC-5) attach a disclosure footer informing clients that an independent second operator must be arranged before the bundle control can be relied upon. See `docs/brand/enterprise-disclosure.md`.

---

## 9) Iteration workflow

### Happy path

```
1. Author drafts in Claude (or Assist / Pro)
2. Downloads -v1.md to Windows Downloads
3. Uploads to zai.htu.io/app (optionally selects bundles)
4. All checks PASS
5. Downloads .scored.md
6. WSL cp to repo (strips -vN and .scored)
7. gh issue create + impl i
```

### Failure path

```
1. Drafts -v1.md
2. Uploads; receives partial score
3. Panel shows failed checks + error messages
4. TARGETED fix (do not rewrite)
5. Saves -v2.md, re-uploads
6. Loop until PASS
```

After 4 failing iterations, stop. Spec type may be wrong, or substance incoherent.

---

## 10) What ZAI does not do

- ❌ Semantic review
- ❌ Implementation review
- ❌ Cost estimation
- ❌ Priority ranking
- ❌ Substitution for human approver review
- ❌ Legal compliance review (bundles check markers; not legal opinions)
- ❌ Exposure of internal ZAI system instructions (proprietary)
- ❌ Render enforceability opinions on contract clauses (explicitly non-goal for `contract_law_signals`)

---

## 11) API surface

```
POST  /api/v1/validate            body: {markdown, spec_type, bundles?}
GET   /api/v1/rubric/:type        returns base rubric
GET   /api/v1/bundles             returns available bundles
GET   /api/v1/bundles/:name       returns specific bundle
POST  /api/v1/score-file          multipart; returns .scored.md binary
GET   /api/v1/models              returns 16 models + scope-restricted
POST  /api/v1/draft/start         Assist session
POST  /api/v1/draft/:id/check     continuous-check
POST  /api/v1/keys                BYOK store
DELETE /api/v1/keys/:provider     BYOK delete
```

OpenAPI at `zai.htu.io/openapi.json`.

---

## 12) Governance of ZAI itself

- Repo: `zi007lin/zai` (to be renamed `zi007lin/zilin-spec` per REFACTOR 2026-04-19)
- Author: `zi007lin`
- Approver: `daniel-silvers`
- Rubrics versioned via SPEC issues
- Rubric changes require approver sign-off
- Breaking changes: 30-day deprecation + version bump
- Bundle changes: industry-expert review

---

## 13) Change log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-04-19 | Initial. Rubrics for FEAT/BUG/SPEC/CHORE/RESEARCH/UX+BRAND. Model declaration + detection + cross-check. Scoring with models panel. Tiers: DIY / Copilot / Pro / Enterprise. |
| 1.1 | 2026-04-19 | Tier "Copilot"→"Assist" (Microsoft trademark). BYOK + Cloudflare-free-default. Internal prompts explicitly non-public. 12-bundle industry catalog. Accessibility default. |
| 1.2 | 2026-04-19 | Added `legal_trigger_declaration` check to every building-type rubric (RESEARCH exempt; reports are non-building). Added `contract_law_signals` bundle (structural only, mandatory disclaimer banner, jurisdiction-agnostic, explicitly not legal advice). Added future `legal_services` bundle slot for 2027+ partner firm use. Rubric counts: FEAT 8→9, BUG 6→7, SPEC 5→6, CHORE 4→5, REFACTOR introduced as first-class type at 9 checks (was previously silently folded into CHORE in implementation — see BUG 2026-04-19), RESEARCH unchanged at 6 (non-building), UX/BRAND 5→6. |
```

---

## Appendix: rubric-count summary (for drift-detection test)

The Layer 3 drift-detection test asserts that rubric arrays in `scoreSpec.ts` match the counts documented above. The authoritative pairs:

| Type | Count | Ordered section IDs (canonical) |
|---|---|---|
| `feat` | 9 | `intent, decision_tree, final_spec, acceptance_criteria, game_theory, migration_summary, files_list, models_applied, legal_triggers` |
| `bug` | 7 | `intent, repro, fix, acceptance_criteria, migration_summary, files, legal_triggers` |
| `spec` | 6 | `intent, decision_tree, rules_or_content, migration_summary, files_schema, legal_triggers` |
| `chore` | 5 | `intent, action, acceptance_criteria, files, legal_triggers` |
| `refactor` | 9 | `intent, decision_tree, final_spec, acceptance_criteria, migration_summary, files_list, models_applied, migration_plan, legal_triggers` |
| `research` | 6 | `intent, research_questions, acceptance_criteria, report_format, migration_summary, files` |
| `ux` | 6 | `intent, jobs_to_be_done, design_rationale, acceptance_criteria, assets_files, legal_triggers` |
| `brand` | 6 | `intent, jobs_to_be_done, design_rationale, acceptance_criteria, assets_files, legal_triggers` |

Drift test implementation notes:
- Parse each `### X rubric (N checks)` heading in this doc
- Assert N equals the length of the corresponding `*_SECTIONS` array in `scoreSpec.ts`
- Parse the section IDs from this Appendix (not from the prose tables, which use human labels)
- Fail CI with a clear diagnostic if any type's count or ordered IDs disagree

---

*End of ZAI_SYSTEM_INSTRUCTIONS.md v1.2*
