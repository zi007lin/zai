# CHORE: Confirm/add `approval_contexts` DDL parity in `0001_initial.sql`

## Intent

Add the `approval_contexts` `CREATE TABLE` + 2 indexes to
`zi007lin/zai/workers/observer/migrations/0001_initial.sql` to maintain
byte-for-byte parity with the canonical D1 schema in `htu-foundation`'s
`governance/specs/zilin-observer-architecture.md` §4, per
`htu-foundation#308` (APPROVAL_CONTEXT record-type ingestion, scored
10/10 PASS). Companion/downstream issue per the EPIC #277 cross-repo
convention: migration-file parity work is filed against the owning
repo (`zi007lin/zai`), not bundled into the `htu-foundation` doc PR.

## Action

1. Confirm `htu-foundation#308` has merged (canonical schema text is
   only final post-merge).
2. Pull the current `0001_initial.sql` from
   `zi007lin/zai/workers/observer/migrations/`.
3. Diff it against the merged §4 schema in `zilin-observer-architecture.md`.
4. Append the `approval_contexts` table + `idx_approval_contexts_target`
   + `idx_approval_contexts_result` indexes, byte-for-byte identical to
   the canonical doc.
5. While in the file, confirm no other pre-existing divergence exists
   between the migration and the canonical schema (spot-check only —
   full reconciliation is out of scope if unrelated drift is found;
   file separately if so).

## Acceptance Criteria

- [ ] `0001_initial.sql` contains the `approval_contexts` CREATE TABLE
      statement, byte-for-byte identical to `zilin-observer-architecture.md`
      §4
- [ ] `0001_initial.sql` contains both `idx_approval_contexts_target`
      and `idx_approval_contexts_result` index statements, byte-for-byte
      identical to the canonical doc
- [ ] No pre-existing schema drift is introduced or left silently
      unflagged (if found, filed as a separate issue rather than fixed
      here)

## Files

```
workers/observer/migrations/0001_initial.sql   # MODIFIED — append approval_contexts DDL
```

## Legal triggers

None. Internal migration-file parity fix with no external contract,
licensing, PHI/PAN, liability, or compensation surface.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Confirm `htu-foundation#308` merged | PR merge | 2 min |
| Diff migration file vs. canonical schema | None | 10 min |
| Append DDL, verify byte-for-byte match | None | 10 min |
| Open PR + review + merge | None | 5-10 min |
| **Total** | — | **~30 min** |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Blocked on `htu-foundation#308` merge | daniel-silvers availability | Same day-ish |
| PR review → merge | daniel-silvers availability | 1 business day |
| **Total** | — | **~1 business day (after #308 merges)** |

### Assumptions

- `htu-foundation#308`'s schema text does not change between now and
  merge (if it does, this chore's DDL must be re-diffed against the
  final merged text before filing the PR).
- No other unrelated schema drift is found; if found, it's filed
  separately rather than silently fixed here.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---|---|---|
| Migration update + review | ~30 min active / ~1 day wall-clock | TBD | TBD |
| **Total** | TBD | TBD | TBD |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** chore
- **Evaluated at:** 2026-07-23T20:50:27.941Z
- **Score:** 6/6
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| action | PASS |
| acceptance_criteria | PASS |
| files | PASS |
| legal_triggers | PASS |
| work_estimate | PASS |

_Source: 2026-05-09__chore__inline.md_

## Provenance (auto-materialized)

- Acquisition path: inline-scored (Path B) via GitHub issue #116 body
- Materialized at: 2026-07-23 by implw flow
- Integrity re-score: PASS (6/6, rubric 1.5.0) — matches embedded score block
