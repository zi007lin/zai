# CHORE: Bump GitHub Actions to Node 24 (actions/checkout@v5, actions/setup-node@v5)

## Intent

CI on `zi007lin/zai` emits Node 20 deprecation warnings on every run. GitHub will force Node 24 by default on June 2 2026 and remove Node 20 from runners on September 16 2026. Bump `actions/checkout` and `actions/setup-node` from `@v4` to `@v5` across all workflows so CI exits the deprecation window without waiting for the forced cutover. Same pattern applies to other HTU repos and will be replicated separately. Out of scope: bumping the Node version pinned inside `setup-node` (`node-version:`); this CHORE only changes the action major versions.

## Action

1. Inventory every workflow in `.github/workflows/` and grep for `actions/checkout@v4` and `actions/setup-node@v4`. The CI run for PR #90 confirms at least `.github/workflows/ci.yml` is affected; the inventory step confirms whether any others exist (e.g. `deploy.yml`, `release.yml`).
2. In each affected workflow, change every `uses: actions/checkout@v4` to `uses: actions/checkout@v5`.
3. In each affected workflow, change every `uses: actions/setup-node@v4` to `uses: actions/setup-node@v5`.
4. For each `setup-node@v5` step: decide whether to keep the new automatic `packageManager`-driven caching (default in v5) or disable it with `package-manager-cache: false`. Default decision is to keep automatic caching ON; revisit only if it conflicts with an existing `cache:` configuration in the same step.
5. Push to a feature branch (`htu/ci-node-24-actions-bump` or similar), open PR against `main`, link to this CHORE issue.
6. Verify CI on the PR: lint and test jobs run green, deprecation warnings on `actions/checkout@v4` and `actions/setup-node@v4` no longer appear in the run annotations.
7. Request review from `daniel-silvers`; merge on approval.
8. After merge, confirm next CI run on `main` is annotation-free for these two actions.

## Acceptance Criteria

- [ ] Every workflow file under `.github/workflows/` that referenced `actions/checkout@v4` now references `@v5`.
- [ ] Every workflow file that referenced `actions/setup-node@v4` now references `@v5`.
- [ ] CI run on the bump PR completes with zero `Node.js 20 actions are deprecated` annotations.
- [ ] CI run on the bump PR completes with both `lint` and `test` jobs green (no regression versus PR #90 baseline of 22 s total).
- [ ] The decision on `setup-node@v5` automatic caching (keep ON by default, or `package-manager-cache: false`) is recorded in the PR description for each step touched.
- [ ] No other actions in the workflow files are running on Node 20 after the bump (a final grep confirms `@v4` of `checkout` and `setup-node` is fully removed).

## Files

```
.github/workflows/ci.yml                                                (UPDATED)
.github/workflows/*.yml                                                 (UPDATED if additional matches found in step 1 inventory)
issues/2026-05-15__chore__ci-node-24-actions-bump-v1.scored.md          (NEW, audit artifact)
```

## Legal triggers

None. The change updates third-party GitHub Action major versions from upstream-published `@v4` to `@v5` of `actions/checkout` and `actions/setup-node`. Both are Apache-2.0 licensed and maintained by GitHub. No PHI, PCI, PII, or contractual data is added, removed, or reclassified. No code in `src/` is changed.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Inventory workflows and grep for `@v4` of the two actions | None | 5 min |
| Edit each workflow file | Inventory complete | 10 min |
| Local sanity check (`actionlint` or yaml-lint if available) | Edits complete | 5 min |
| Open PR with description noting cache decision | Local check complete | 10 min |
| Verify PR CI is green and annotations cleared | PR opened | 5 min |
| Approver review and merge | CI green | 10 min |
| Total | | 45 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Inventory + edits + local check | None | 0.25 day |
| Open PR; CI runs | Edits complete | 0.1 day |
| Approver review and merge | CI green | 0.5 day (waits on daniel-silvers) |
| Total | | 1 day |

### Assumptions

- Operator has local clone of `zi007lin/zai` with push rights on a feature branch.
- GitHub-hosted runners (`ubuntu-latest`) are in use; runner version is already at or above 2.327.1 (the minimum compatible runner for `checkout@v5`). All current `ubuntu-latest` images satisfy this.
- No workflow pins `actions/checkout` or `actions/setup-node` to a SHA instead of `@v4`; if a SHA pin is found, that workflow is updated to the equivalent SHA pin for `@v5` rather than the moving major tag.
- `setup-node@v5` automatic caching (new behavior when `packageManager` is set in `package.json`) is acceptable. If it causes friction with an existing `cache: 'npm'` block in the same step, that step is exempted with `package-manager-cache: false` and the exception is recorded in the PR description.
- daniel-silvers is available for approver review within 1 day of PR open.

### Actuals (filled post-execution)

| Phase | Wait dependency | Estimate | Actual | Delta |
|---|---|---|---|---|
| Inventory + edits + local check | None | 0.25 day | TBD | TBD |
| Open PR; CI runs | Edits complete | 0.1 day | TBD | TBD |
| Approver review and merge | CI green | 0.5 day | TBD | TBD |
| Total | | 1 day | TBD | TBD |

## Run locally (optional)

```bash
cp /mnt/c/Users/zilin/Downloads/2026-05-15__chore__ci-node-24-actions-bump-v1.scored.md \
   ~/dev/zai/issues/

cd ~/dev/zai
gh issue create \
  --title "CHORE: Bump GitHub Actions to Node 24 (actions/checkout@v5, actions/setup-node@v5)" \
  --body-file issues/2026-05-15__chore__ci-node-24-actions-bump-v1.scored.md \
  --label chore,ci

# Note returned issue number, then:
implw <issue-number>
```

## Notes

- Replicate the same bump on other HTU repos (`htu-foundation`, `htu.io`, `streettt`, `zzv-skills`, etc.) as separate CHOREs filed per-repo. Each follows the same pattern; estimates similar.
- If a workflow already uses a newer major than `@v4` (e.g. a repo already on `@v6` of `checkout`), skip that file in that repo's bump.

---

## ZAI Spec Score

- **Rubric version:** 1.5.0
- **Spec type:** chore
- **Evaluated at:** 2026-05-15T22:51:52.331Z
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

