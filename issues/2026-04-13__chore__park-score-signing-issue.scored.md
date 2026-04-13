# 2026-04-13__chore__park-score-signing-issue

**Repos:** `zi007lin/zai` + `zi007lin/streettt` + `htu-foundation`
**Label:** `chore`
**Branch:** `zai/park-score-signing-issue` / `stt/park-score-signing-issue` / `htu/park-score-signing-issue`
**Reviewer:** daniel-silvers

## Intent

Commit the parked spec `2026-04-13__feat__zai-score-signing-cf-worker.md` to `issues/parked/` in the zai repo and create a matching GitHub Issue labeled `parked`. Additionally, audit and create the full standard label set across all three HTU repos (`zai`, `streettt`, `htu-foundation`). Labels have been declared in spec metadata but never systematically created — this closes that gap.

---

## Files

```
zi007lin/zai/issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md  ← new
```

---

## Steps

### 1. Audit and create standard labels — ALL THREE REPOS

Run the following for each repo. The `2>/dev/null || true` suppresses errors for labels that already exist.

**Standard label set (apply identically to zai, streettt, htu-foundation):**

```bash
for REPO in zi007lin/zai zi007lin/streettt zi007lin/htu-foundation; do
  echo "=== $REPO ==="

  gh label create "feat" \
    --repo $REPO \
    --description "New feature" \
    --color "AFA9EC" 2>/dev/null || true

  gh label create "research" \
    --repo $REPO \
    --description "Research/audit task — produces a report, no code" \
    --color "85B7EB" 2>/dev/null || true

  gh label create "chore" \
    --repo $REPO \
    --description "Maintenance, deployment, config" \
    --color "D3D1C7" 2>/dev/null || true

  gh label create "bug" \
    --repo $REPO \
    --description "Something is broken" \
    --color "F09595" 2>/dev/null || true

  gh label create "hotfix" \
    --repo $REPO \
    --description "Urgent fix for a live issue" \
    --color "EF9F27" 2>/dev/null || true

  gh label create "parked" \
    --repo $REPO \
    --description "Blocked on prerequisite — do not impl" \
    --color "888780" 2>/dev/null || true

  gh label create "spec" \
    --repo $REPO \
    --description "Specification or design document" \
    --color "9FE1CB" 2>/dev/null || true

  gh label create "refactor" \
    --repo $REPO \
    --description "Code restructure, no behavior change" \
    --color "D3D1C7" 2>/dev/null || true

  echo "Labels done for $REPO"
done
```

After running, verify each repo:
```bash
for REPO in zi007lin/zai zi007lin/streettt zi007lin/htu-foundation; do
  echo "=== $REPO ===" && gh label list --repo $REPO
done
```

Expected: all 8 labels present in each repo.

### 2. Create `issues/parked/` and commit the spec (zai only)

```bash
cd ~/dev/zai
mkdir -p issues/parked
cp /mnt/c/Users/zilin/Downloads/2026-04-13__feat__zai-score-signing-cf-worker.md \
   issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md
git add issues/parked/
```

### 3. Create GitHub Issue in zai (parked label)

```bash
gh issue create \
  --repo zi007lin/zai \
  --title "feat: ZAI score signing via CF Worker (PARKED)" \
  --label "parked" \
  --body "$(cat <<'BODY'
## Status: PARKED

Blocked on prerequisite — do not implement until the CF Worker scaffold
exists in this repo.

**Prerequisite:** CF Worker scaffold (`wrangler.jsonc` + worker entrypoint)
must exist and be deployable before this spec runs.

**What this builds:** Server-side spec scoring with HMAC-SHA256 signing.
Every score block gets a cryptographic signature from a CF secret key.
ZiLin-Dev verifies the signature before impl — hand-typed or altered score
blocks are rejected cryptographically.

**Supersedes:** Option B behavioral re-run check once deployed.

**To unpark:** Change label `parked` → `feat`, score the spec at
`/app`, download `.scored.md`, then run impl.

**Spec file:** `issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md`
BODY
)"
```

### 4. Open one PR per repo

- **zai:** adds `issues/parked/` directory + spec file
- **streettt:** label-only change (no files) — empty commit with message `chore: Ensure standard GitHub labels exist`
- **htu-foundation:** same as streettt

For repos where only labels changed (no file changes), create a minimal commit touching a README or adding a `.github/labels.yml` inventory file so the PR has a diff:

```bash
# For streettt and htu-foundation
cat > .github/labels.yml << 'LABELS'
# Standard HTU label set — managed by chore spec
# 2026-04-13__chore__park-score-signing-issue
- name: feat
  color: AFA9EC
  description: New feature
- name: research
  color: 85B7EB
  description: Research/audit task — produces a report, no code
- name: chore
  color: D3D1C7
  description: Maintenance, deployment, config
- name: bug
  color: F09595
  description: Something is broken
- name: hotfix
  color: EF9F27
  description: Urgent fix for a live issue
- name: parked
  color: "888780"
  description: Blocked on prerequisite — do not impl
- name: spec
  color: 9FE1CB
  description: Specification or design document
- name: refactor
  color: D3D1C7
  description: Code restructure, no behavior change
LABELS
git add .github/labels.yml
git commit -m "chore: Add .github/labels.yml — standard HTU label inventory"
```

This `.github/labels.yml` file also serves as the canonical label source of truth going forward — any new label must be added here before being created in GitHub.

---

## Acceptance Criteria

- [ ] All 8 standard labels exist in `zi007lin/zai`
- [ ] All 8 standard labels exist in `zi007lin/streettt`
- [ ] All 8 standard labels exist in `zi007lin/htu-foundation`
- [ ] `.github/labels.yml` committed to all three repos
- [ ] `issues/parked/` directory created in zai
- [ ] Parked spec file committed to `issues/parked/` in zai
- [ ] GitHub Issue created in zai with `parked` label and "(PARKED)" in title
- [ ] Three PRs opened — one per repo — all assigned to daniel-silvers
- [ ] `gh label list` output for all three repos shows all 8 labels

---

## Subject Migration Summary

| | |
|---|---|
| What | Standard labels across all 3 HTU repos + park CF Worker signing spec in zai |
| State | Spec complete; needs scoring before impl |
| Open questions | Does `htu-foundation` have a different org owner? Confirm repo path before running the label loop |
| Next action | Score at `/app` → download `.scored.md` → `impl i` |
| Repos | `zi007lin/zai` + `zi007lin/streettt` + `zi007lin/htu-foundation` |

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T07:02:21.626Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__park-score-signing-issue.md_
