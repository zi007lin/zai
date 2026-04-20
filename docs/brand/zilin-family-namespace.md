# ZiLin-\* Family Namespace

**Status:** Authored 2026-04-19 · Promoted 2026-04-20 during Phase 1 impl
**Authoritative spec:** `issues/2026-04-19__refactor__zilin-brand-migration.md`
**Current location:** `zi007lin/zai/docs/brand/zilin-family-namespace.md` (moves with the Phase 2 repo rename to `zi007lin/zilin-spec`)

This document defines the ZiLin-\* product family: active members, reserved names, activation rules, and expiry policy.

---

## Prefix rule

All AI-forward tooling and products under the founder's direct authorship use the `ZiLin-` prefix followed by a function-descriptive suffix. Suffix is capitalized and singular. Hyphen separator is required.

**Form:** `ZiLin-<Function>` (capitalized suffix, PascalCase not required for single-word suffixes)

**Examples:**
- `ZiLin-Spec` ✓
- `ZiLin-Scheduler` ✓
- `ZiLin-Assistant` ✓ (reserved)
- `ZiLin-Coach` ✓ (reserved)

**Not valid:**
- `ZiLinSpec` (no hyphen)
- `zilin-spec` (lowercase form; reserved for technical slugs like hostnames, repo names, package IDs)
- `ZILIN_SPEC` (ALL CAPS is reserved for env vars and symbol naming)

**Casing variants (canonical by context):**

| Context | Form | Example |
|---|---|---|
| Product name in prose / UI | `ZiLin-<Name>` | "ZiLin-Spec validates…" |
| Domain, repo, package id | `zilin-<name>` | `zilin-spec.htu.io` · `zi007lin/zilin-spec` |
| Env var, constant, symbol | `ZILIN_<NAME>_*` | `ZILIN_SPEC_TOKEN` |
| Systemd unit, filesystem path | `zilin-<name>` | `zilin-scheduler.service` · `/etc/zilin-scheduler/` |

## Active members

| Name | Role | State | Notes |
|---|---|---|---|
| **ZiLin-Spec** | Spec validation service (scoring, rubric, audit trail) | Brownfield migration from ZAI | Phased cutover per REFACTOR Phase 0–3 |
| **ZiLin-Scheduler** | Scheduling / cron / publish-audit service | Greenfield — build under new name | No prior ZaiVM deployment; clean slate |

## Reserved names

Reserved names are documented here but have no implementations, repos, or domains yet. Reservation is **internal precedence only** — it does not create public trademark rights. Rights accrue on use.

| Name | Intended role | Reserved on | Expires | Activation requirement |
|---|---|---|---|---|
| **ZiLin-Assistant** | Future user-facing AI layer across medicshare, shoplement, StreetTT admin surfaces | 2026-04-19 | 2028-04-19 | New SPEC citing this REFACTOR for name provenance |
| **ZiLin-Coach** | Future consumer helper (coaching, skill progression, practice plans) | 2026-04-19 | 2028-04-19 | New SPEC citing this REFACTOR for name provenance |

### Expiry rule — 24 months

If a reserved name is **not activated** (no spec written, no repo created, no public announcement) within 24 months of its reservation date, the reservation lapses. The name returns to the common pool and can be reassigned to a different function without carrying the reservation's provenance claim.

**Rationale:** prevents internal squatting on names we end up not building. 24 months matches a practical product-strategy horizon — anything we haven't committed to building in that window was probably never going to ship.

**Renewal:** a reserved name can be renewed for another 24 months before it lapses, via a one-line edit in this document with a renewal date. Reservations can be renewed at most once; after that they must either activate or return to the pool.

### Activation requirement

Activating a reserved name requires:

1. A new SPEC file (not this REFACTOR) naming the product and its role.
2. An explicit citation line in that spec: `Name provenance: reserved in docs/brand/zilin-family-namespace.md on 2026-04-19.`
3. Corresponding repo, domain, or service record under the canonical casing rules above.

Activation updates this file: the row moves from "Reserved names" to "Active members" with the activation date replacing the reservation date.

## Rejected names (for the record)

Decision Tree captured these alternatives as rejected during the 2026-04-19 REFACTOR:

| Rejected | Reason |
|---|---|
| `ZiLin-Copilot` | Collision with GitHub Copilot |
| `ZiLin-AIstant` | Typo-fragile; "AI" infix is awkward |
| `ZiLin-Helper`, `ZiLin-Buddy` | Generic; weak brand signal |
| `ZiLinVM` | Misleading "VM" framing for what is actually a scheduler/publisher |
| `ZiLin-Cron` | Too infrastructure-y for what is intended as a product brand |
| `ZiSpec` | Viable, but loses the family benefit. Retained as fallback if `ZiLin-Spec` hits a TM conflict. |
| `ZiLin-Reviewer` | Implies human-review semantics the validator does not provide |

## Not family members

These brands exist under HTU but are **not** part of the ZiLin-\* family. They have independent brand equity and are explicitly out of scope for the REFACTOR:

- **StreetTT** (HTU product with its own brand; paddle mark, streettt.com)
- **HTU / htu.io** (parent org)
- **zzv.io** (chain/audit brand)
- **HTTC** (separate legal entity; DYCD Beacon Agreement #99358B)
- **medicshare**, **shoplement**, **NYQEX** (sibling HTU products)

Future sibling products are only ZiLin-\* family members if they are direct founder-authored AI tooling. HTU-wide consumer products remain under their own brands even if they integrate ZiLin-\* components internally.

## Logo and visual identity

Umbrella mark: the **Kitsune fox** direction becomes the ZiLin brand mark. Sub-products use typographic lockups until the Fiverr vector commission returns.

StreetTT keeps its paddle mark. It is not being re-skinned under ZiLin.

Visual identity details are out of scope for this namespace doc.

## Governance of this document

- New members, reservations, and renewals are added by PR.
- Expiry decisions can be applied in a one-line edit with a date.
- Fallback name activation (e.g. promoting `ZiSpec` if `ZiLin-Spec` hits a conflict) requires a new SPEC and updates both this file and `zilin-rename-rationale.md`.
- Historical rows (rejected names, lapsed reservations) are preserved, not deleted. The record of what was considered is part of the archival value.
