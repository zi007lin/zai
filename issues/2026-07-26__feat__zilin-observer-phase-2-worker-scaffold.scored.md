# FEAT: Implement Zilin Observer Phase 2 Worker scaffold

## Intent

Implement the missing Zilin Observer Phase 2 Worker scaffold in `zi007lin/zai` so the canonical Observer architecture approved in `zi007lin/htu-foundation#308` and merged through PR `#309` can be realized in code. This creates the Worker package, baseline D1 migration, configuration, health/readiness behavior, and tests required before dependent CHORE `zi007lin/zai#116` can safely add its narrowly scoped `approval_contexts` DDL parity adjustment.

The feature must establish the complete baseline Observer schema defined by the canonical architecture without absorbing the separate responsibility assigned to issue `#116`. The scaffold must be independently buildable, testable, and deployable, while remaining inert with respect to production deployment until normal governance gates are satisfied.

## Decision Tree

| Decision | Options | Chosen | Why |
|---|---|---|---|
| D1: Where should the Observer runtime live? | Add to an existing Worker / create `workers/observer` / create a separate repository | Create `workers/observer` in `zi007lin/zai` | The canonical architecture names this repository and path, and colocating the runtime with ZAI preserves governance and schema ownership. |
| D2: How should the initial database schema be introduced? | Runtime-created tables / multiple incremental migrations / one baseline migration | `migrations/0001_initial.sql` | A deterministic baseline migration provides auditable bootstrap behavior and gives later parity CHOREs a stable target. |
| D3: What schema source is authoritative? | Reconstruct from issue #116 / infer from code / canonical architecture §4 | Canonical `zilin-observer-architecture.md` §4 | This prevents issue-local assumptions from becoming the source of truth. |
| D4: Should this FEAT implement `approval_contexts` parity owned by #116? | Include it / partially include it / leave it to #116 | Leave the explicit parity adjustment to #116 | Preserves scope and allows #116 to remain a separately verifiable CHORE after the baseline exists. |
| D5: What runtime behavior is required at scaffold completion? | Empty Worker / health-only endpoint / full Observer processing | Health/readiness endpoint plus structural runtime shell | This proves deployability without inventing unapproved Observer processing behavior. |
| D6: How should D1 correctness be verified? | Manual inspection / migration test only / migration plus schema assertions | Migration on an empty database plus schema assertions | This catches syntax errors and omissions before dependent work begins. |
| D7: Should this FEAT deploy to production automatically? | Yes / DEV only / no automatic deployment | No automatic deployment | Implementation, review, merge, and deployment remain governed independently. |

### Trigger for change

Revisit these decisions only if the canonical Observer architecture is amended, the named repository/path changes, Cloudflare Worker or D1 constraints make the baseline invalid, or issue #116 is formally rescoped by governance.

## Final Spec

Create a new Cloudflare Worker package at `workers/observer/` with:

- `package.json` containing reproducible build, typecheck, test, and migration-validation commands consistent with repository conventions.
- `tsconfig.json` using the repository-supported TypeScript configuration.
- `wrangler.toml` defining the Observer Worker and its D1 binding without embedding secrets or triggering deployment.
- `src/index.ts` exporting the Worker entry point.
- A minimal HTTP readiness surface:
  - `GET /health` returns HTTP `200` and a stable JSON payload identifying the Observer service as healthy.
  - Unsupported routes return a deterministic non-success response.
- `migrations/0001_initial.sql` implementing the complete baseline D1 schema from §4 of `zi007lin/htu-foundation/governance/specs/zilin-observer-architecture.md` as merged through PR #309.
- Tests that apply `0001_initial.sql` to an empty database, assert the expected tables and critical indexes/constraints, typecheck the Worker, and verify the readiness route.
- Repository-level integration only where required to include the package in existing lint, typecheck, or test orchestration.

Scope boundary:

1. This FEAT creates the scaffold and baseline schema.
2. It does not implement production event ingestion, governance decisions, approval execution, or deployment automation unless already required verbatim by the canonical architecture.
3. It does not silently close or rewrite issue #116.
4. After merge, issue #116 must be resumed against the newly existing `workers/observer/migrations/0001_initial.sql`.
5. Any mismatch between the canonical schema and implementable D1 syntax must be surfaced as a blocker rather than guessed.

## Acceptance Criteria

- [ ] `workers/observer/` exists on `main` with `src/`, `test/`, `migrations/`, `package.json`, `tsconfig.json`, and `wrangler.toml`.
- [ ] `workers/observer/migrations/0001_initial.sql` applies successfully to a clean local test database.
- [ ] Automated schema assertions verify every baseline table required by canonical architecture §4, together with its critical keys, indexes, and constraints.
- [ ] The baseline migration does not claim completion of the separate `approval_contexts` parity adjustment assigned to `zi007lin/zai#116`.
- [ ] `GET /health` returns HTTP `200` with deterministic JSON, and unsupported routes return a deterministic non-success response.
- [ ] Worker build, typecheck, and tests pass using documented repository commands.
- [ ] No credentials, production bindings, or automatic deployment side effects are introduced.
- [ ] The implementation PR references `htu-foundation#308`, PR `#309`, and declares that `zai#116` is unblocked only after this FEAT merges.

## Game Theory Cooperative Model review

### Who benefits

Spec authors gain a canonical implementation target; implementation agents gain a deterministic scaffold and migration; reviewers gain testable schema evidence; issue #116 gains a valid prerequisite; operators gain a deployable but non-auto-deployed Worker package. Honest play is the dominant strategy because each participant can verify the same architecture, migration, and tests without relying on undocumented assumptions.

### Abuse vector

- An implementer could fabricate a reduced schema merely to make tests pass.
- A contributor could absorb issue #116 into this FEAT and erase independent parity verification.
- A deployment path could be added that silently targets production.
- Runtime behavior could be invented beyond the approved architecture.

### Mitigation

- Compare migration assertions directly with canonical architecture §4.
- Preserve #116 as an explicit downstream dependency and scope boundary.
- Require review of Worker configuration and prohibit embedded credentials or automatic production dispatch.
- Limit runtime behavior to readiness and architecture-required structural shells.
- Fail closed on canonical-document ambiguity and record any discrepancy for governance resolution.

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| Observer Worker runtime | No `workers/observer` implementation exists in `zi007lin/zai` | Buildable and testable Cloudflare Worker scaffold exists at the canonical path |
| Observer D1 schema | Canonical schema exists only in governance documentation | Baseline schema is materialized in `migrations/0001_initial.sql` and tested on an empty database |
| Issue #116 dependency | Blocked because its target migration file does not exist | Target migration exists and #116 can resume without expanding its scope |
| Production behavior | No Observer Worker deployment from this FEAT | Still requires separate governed deployment action |
| Open questions | D1-specific incompatibilities must be surfaced during implementation | Resolved in the implementation PR or escalated without guessing |

## Files created / updated

```text
workers/observer/package.json                  # NEW — package scripts and dependencies
workers/observer/tsconfig.json                 # NEW — TypeScript configuration
workers/observer/wrangler.toml                  # NEW — Worker and D1 configuration without secrets
workers/observer/src/index.ts                   # NEW — Worker entry point and readiness route
workers/observer/migrations/0001_initial.sql   # NEW — canonical baseline Observer schema
workers/observer/test/health.test.ts            # NEW — readiness behavior tests
workers/observer/test/migration.test.ts         # NEW — clean-database migration and schema assertions
package.json or workspace configuration         # UPDATED only if required for repository orchestration
CI/workflow configuration                       # UPDATED only if required to run package checks
```

## Models Applied

- #2 Decision Tree
- #1 Game Theory Cooperative Model
- #15 Inversion / Premortem
- #16 Mechanism Design

### #2 Decision Tree (above)

The Decision Tree is the authoritative record for repository placement, migration strategy, schema authority, issue #116 separation, runtime surface, test depth, and deployment boundaries.

### #1 Game Theory Cooperative Model

The cooperative equilibrium is achieved when architecture authors, implementers, reviewers, and downstream issue owners use the same canonical schema and preserve independent verification boundaries. Defection by reducing schema scope or hiding deployment side effects is made detectable through migration assertions, configuration review, and explicit dependency references.

### #15 Inversion / Premortem

Assume the FEAT failed: #116 remains blocked, the migration applies but omits tables, the Worker cannot build, or an accidental production deployment occurs. Prevent these outcomes with clean-database schema assertions, repository-native build/typecheck tests, explicit scope boundaries, and no automatic deployment action.

### #16 Mechanism Design

The mechanism aligns incentives by making the easiest successful path the canonical one: implement the documented schema, pass deterministic tests, preserve #116 as downstream work, and submit through normal review. Attempts to bypass the architecture or collapse scopes produce observable acceptance-criteria failures.

## Legal triggers

None

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Canonical schema extraction and scaffold implementation | None | 3 hours |
| Tests and repository integration | None | 2 hours |
| Review corrections and dependency handoff | Reviewer feedback | 1 hour |
| **Total** | — | **6 hours** |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Implementation and CI | CI execution | 1 working day |
| Review and merge governance | Reviewer availability | 1–2 working days |
| **Total** | — | **2–3 working days** |

### Assumptions

- Canonical architecture §4 contains a complete baseline schema suitable for translation to D1 SQL.
- Existing repository conventions provide usable Worker, TypeScript, and test patterns.
- Any D1 incompatibility is resolved through review rather than silent semantic changes.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---|---|---|
| Canonical schema extraction and scaffold implementation | 3 hours | TBD | TBD |
| Tests and repository integration | 2 hours | TBD | TBD |
| Review corrections and dependency handoff | 1 hour | TBD | TBD |
| **Total** | **6 hours** | **TBD** | **TBD** |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** feat
- **Evaluated at:** 2026-07-26T07:26:16.387Z
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

## Provenance (auto-materialized)

- Materialized from: `zi007lin/zai#117` (inline-scored issue body, Path B)
- Materialized at: 2026-07-26T07:42:50.000Z
- Integrity re-score: MATCH — 10/10, rubric 1.5.0, PASS (via `score_spec` MCP tool)
- Note: original `_Source:` footer (`2026-05-09__feat__inline.md`) refers to no file resolvable in `issues/` or `issues/parked/`; this file is the authoritative materialization for issue #117.
