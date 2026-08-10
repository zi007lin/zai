# CHORE: Adopt the canonical PR-validation contract (thin caller + PR template) for zai

## Intent

zai currently has neither a PR template nor any PR-validation CI check. Adopt the canonical contract established in htu-foundation (CHORE htu-foundation#351, PR #352) — a thin caller referencing htu-foundation's reusable `workflow_call` workflow, plus a PR template using the canonical 4-status (`automated`/`manual`/`none`/`blocked`) `## Deployment` format — starting in observe-only mode.

## Action

1. Add `.github/pull_request_template.md` using the canonical 4-status format, mirroring htu-foundation's template structure exactly.
2. Add `.github/workflows/pr-validation.yml` as a thin caller: `uses: zi007lin/htu-foundation/.github/workflows/pr-validation.yml@<pinned-ref>`, with `test_command: "npm test"` (zai's actual `vitest run` script), `typecheck_command: "npx tsc --noEmit"` (zai's real typecheck step — note zai's own `npm run lint` script is actually `tsc --noEmit`, a misleading name; use the direct `tsc --noEmit` invocation here rather than `npm run lint` to avoid confusion about what's actually being checked), `blocking: false`.
3. Open a test PR against zai and confirm it receives the canonical "PR Validation (canonical, htu-foundation)" comment, running in observe-only mode (does not block merge).
4. Confirm htu-foundation's conformance check (`src/validation/conformanceCheck.js`) reports zai as `conformant` after this merges — not `not_adopted`.
5. After an observe-only bake period with real PR traffic, a separate later decision (not this CHORE) records approval and flips `blocking: true`.

## Acceptance Criteria

- [ ] `.github/pull_request_template.md` exists with exactly one canonical `## Deployment` heading.
- [ ] `.github/workflows/pr-validation.yml` exists, containing only a `workflow_call` reference to the canonical htu-foundation workflow at a pinned (non-`main`) ref — zero copied validator logic.
- [ ] A test PR against zai receives the canonical validation comment, running in observe-only mode.
- [ ] htu-foundation's conformance check reports zai as `conformant`, confirmed by re-running it after this merges.

## Files

```
zai/.github/pull_request_template.md   # NEW — currently missing entirely
zai/.github/workflows/pr-validation.yml # NEW — thin caller; no PR-validation workflow exists today
```

## Legal triggers

None.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Add PR template | None | 20 min |
| Add thin-caller workflow | None | 20 min |
| Open + verify test PR | CI run on the test PR | 20 min |
| **Total** | — | ~1 hr |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Implementation + verification | CI run | Same day |
| Observe-only bake before considering blocking flip | Real PR traffic | 1-2 weeks (separate, later decision) |
| **Total** | — | Same day for this CHORE; blocking flip is separate |

### Assumptions

- htu-foundation's canonical workflow has (or will have) a pinned tag/release available — not just PR #352's raw merge commit SHA. If none exists yet, pin to the merge commit SHA as an interim measure.
- zai's `npm run lint` script is actually a `tsc --noEmit` invocation (misleadingly named) — this CHORE uses the direct `tsc --noEmit` command as `typecheck_command` rather than `npm run lint`, to avoid the caller workflow's typecheck step being labeled/described as "lint" when it's really a type check.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---|---|---|
| Add PR template | 20 min | 5 min | -15 min — verbatim copy of htu-foundation's canonical template. |
| Add thin-caller workflow | 20 min | 5 min | -15 min — release tag already existed; `test_command`/`typecheck_command` confirmed from `package.json` (`"test": "vitest run"`, `"lint": "tsc --noEmit"` — used directly as `npx tsc --noEmit` per the issue's explicit instruction). |
| Open + verify test PR | 20 min | TBD | This PR itself serves as the test PR — self-trigger evidence pending review. `zi007lin/zai` is owned by the `zi007lin` user account (same as the two `zi007lin`-owned sibling adoptions, zzv-skills#675/PR #676 and htu.io#330/PR #331), so it is covered by the existing `user`-level Actions access grant on `htu-foundation` — but that grant did not resolve the `startup_failure` on either sibling repo, so the same failure is expected here too. Not re-diagnosed. |
| **Total** | ~1 hr | ~10 min (implementation) | Known, documented platform gap (`startup_failure`) applies here identically to the other `zi007lin`-owned adoptions. |

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** chore
- **Evaluated at:** 2026-08-10T02:57:54.799Z
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

## Provenance (auto-materialized)

- **Source:** inline-scored issue body — zi007lin/zai#120
- **Materialized at:** 2026-08-10
- **Filename derivation:** derived from issue (§4.1 rule 2) — the issue body's `_Source:` footer pointed to the literal generic slug `inline`, which rule 1 explicitly excludes; filename built from the issue's `createdAt` UTC date (2026-08-10), the `CHORE:` title-prefix type, and a kebab-case slug truncated to ~60 characters.
- **Acquisition path:** MCP → GitHub Issue → implw acquisition (Path B, inline-scored).

**Note on known platform gap:** the thin caller's own self-trigger check is expected to fail with the same `startup_failure` documented on zzv-skills#675/PR #676 and htu.io#330/PR #331 — `htu-foundation`'s Actions cross-repo access is correctly configured (`user`, covering `zi007lin`-owned repos including this one) but the reusable-workflow resolution fails to start any job regardless of tag-vs-SHA pinning. Not re-diagnosed here. Non-blocking (`blocking: false`).
