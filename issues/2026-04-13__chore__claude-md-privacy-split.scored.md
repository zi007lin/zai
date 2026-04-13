# 2026-04-13__chore__claude-md-privacy-split

**Repos:** `zi007lin/zai` + `streettt-private`
**Label:** `chore`
**Branch:** `zai/claude-md-privacy-split` / `stt/claude-md-privacy-split`
**Reviewer:** daniel-silvers
**⚠️ WARNING:** This spec includes a force-push to scrub git history. Coordinate with daniel-silvers before executing. All local clones must be re-pulled after the force push.

---

## Intent

Split zai/CLAUDE.md into a public stub (governance rules only) and a private implementation layer (streettt-private). Scrub the git history of `CLAUDE.md` in the public `zi007lin/zai` repo so the Layer 2 command inventory, local path structure (`~/dev/zai`), and `npx tsx` invocation details are never visible in public history — not in the current state, not in any past commit. This is a one-time history rewrite. Going forward, sensitive operational details are never committed to any public repo.

**Rule encoded permanently:** Private implementation details — local paths, command inventories, toolchain invocations, symlink structures — belong in `streettt-private` only. Public repos get governance rules and stubs only. This rule is non-negotiable and applies to all HTU repos.

---

## Decision Tree

**Question:** How do we remove sensitive content from public git history?

| Option | Removes history | Complexity | Risk | Decision |
|---|---|---|---|---|
| New commit that removes content | ❌ History still visible | Low | None | ❌ Content still in past commits |
| `git filter-repo` on CLAUDE.md | ✅ Complete rewrite | Medium | Force push required | ✅ Chosen |
| Delete repo + recreate | ✅ Complete | High | Loses all PRs/issues/stars | ❌ Too destructive |
| Make repo private | ✅ Hides history | Low | Breaks public access | ❌ Wrong direction |

**Decision:** `git filter-repo` rewrites every commit that touched `CLAUDE.md`, replacing the file content with the clean public version from the start. Force push to main. All collaborators must re-pull.

**Trigger for change:** Never again — the permanent rule prevents this from recurring.

---

## Draft-of-thoughts

The sensitive content that must be scrubbed from history:
- `~/dev/zai` local path reference
- `npx tsx -e "import { scoreSpec }..."` full invocation
- Layer 2 symlink setup: `~/dev/streettt-private/.claude/commands/`
- Command inventory: `autopilot.md deploy.md eval.md impl.md review.md spec.md`
- `for f in autopilot.md...` bash loop

None of this is a secret in the cryptographic sense — no passwords or keys. But it reveals the internal toolchain structure, the private repo name and path, and the command architecture to anyone reading git history. That's enough to make it private.

The `git filter-repo` approach rewrites history but keeps all commits, timestamps, and messages intact. Only the file content changes. PRs, issues, stars, and forks are unaffected (GitHub issues/PRs are stored separately from git objects).

---

## Final Spec

### Phase 1 — New public CLAUDE.md content (zai repo)

Replace `CLAUDE.md` with exactly:

```markdown
# CLAUDE.md — ZAI

**Repo:** zi007lin/zai
**Reviewer:** daniel-silvers
**Branch naming:** `zai/<issue-slug>`
**Deploy target:** dev only

ZAI — Zero Ambiguity Intelligence. The engine of Spec Driven Development by High Tech United.

## Hard Rules — impl gate

**SCORE GATE — EXPLICIT DISALLOW**

`impl` is forbidden on any spec file that does not contain a valid ZAI score block.

Before executing any `impl` or `implw` command, ZiLin-Dev MUST:

1. Read the spec file
2. Search for the pattern: `## ZAI Spec Score` (exact heading, case-sensitive)
3. If absent → STOP:
   `needs_input: score this spec at dev.zai.htu.io/app first, then re-download the .scored.md`
4. If present, check for `- **Passed:** YES`
   If absent or NO → STOP:
   `needs_input: spec score is not passing — fix failing sections and re-score before impl`
5. If passed → run integrity check per Layer 2 impl command (streettt-private).

No exceptions. No overrides. No "I'll proceed anyway since the intent is clear."

The correct workflow:
  Write spec → upload to dev.zai.htu.io/app → download .scored.md → run impl on .scored.md

Note: re-run integrity check (Option B) is superseded by CF Worker signature
verification (Option A) once SCORE_SIGNING_KEY is live. See
`issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md`.

## Layer 2 Commands

Implementation details are in streettt-private (never in this public repo).
Run `impl i <scored-spec.md>` to execute any scored spec.

## Dual-PR Governance

- zi007lin authors PRs; never merges own PRs
- daniel-silvers reviews and merges
- All PRs require AI validation pass + reviewer approval

## Commit Identity

git config user.name "ZiLin"
git config user.email "noreply@zzv.io"

Never add Co-Authored-By trailers.

---

**Permanent rule:** Sensitive operational details — local paths, command inventories,
toolchain invocations, symlink structures — belong in streettt-private only.
Public repos contain governance rules and stubs only. No exceptions.
```

### Phase 2 — Scrub git history of CLAUDE.md in zai

```bash
cd ~/dev/zai

# Install git-filter-repo if not present
pip install git-filter-repo --break-system-packages

# Verify clean working tree
git status --short
# Must show clean before proceeding

# Create the clean CLAUDE.md content as a blob replacement
# (git filter-repo rewrites all commits that touched CLAUDE.md)
git filter-repo --path CLAUDE.md --blob-callback '
import re
# Replace file content in all historical commits with the clean public version
blob.data = open("/tmp/CLAUDE_clean.md", "rb").read()
' --force

# Verify history is clean
git log --all --oneline -- CLAUDE.md | head -10
git show HEAD:CLAUDE.md | grep -i "streettt-private\|~/dev\|npx tsx\|autopilot\|symlink"
# Must return zero matches
```

**Before running filter-repo, write the clean content to /tmp:**
```bash
cat > /tmp/CLAUDE_clean.md << 'CLEANEOF'
[paste the exact public CLAUDE.md content from Phase 1 above]
CLEANEOF
```

### Phase 3 — Force push

```bash
# This rewrites public history — coordinate with daniel-silvers first
git push origin main --force-with-lease

# Notify daniel-silvers to re-pull:
# cd ~/dev/zai && git fetch origin && git reset --hard origin/main
```

### Phase 4 — Add to streettt-private

Append the following to `streettt-private/CLAUDE.md` under a new section
`## ZAI Layer 2 — Score integrity implementation`:

```markdown
## ZAI Layer 2 — Score integrity implementation

Full re-run integrity check for zai specs (steps 6–9 of the score gate):

6. Extract spec content above `## ZAI Spec Score` heading.

7. Re-run rubric:
   ```bash
   cd ~/dev/zai && npx tsx -e "
     import { scoreSpec } from './src/lib/scoreSpec.ts';
     import { readFileSync } from 'fs';
     const raw = readFileSync(process.argv[1], 'utf8');
     const idx = raw.search(/^## ZAI Spec Score$/m);
     const content = idx === -1 ? raw : raw.slice(0, idx);
     const name = process.argv[1].split('/').pop();
     console.log(JSON.stringify(scoreSpec(content, name)));
   " <spec-file-path>
   ```
   For streettt: use same structural regex checks from `zi007lin/zai/src/lib/scoreSpec.ts`.

8. Compare live vs stored (spec_type, score, passed) — mismatch → STOP.

9. Runs on every invocation. Re-score when RUBRIC_VERSION changes.

## ZAI Layer 2 — Command setup

```bash
mkdir -p ~/dev/zai/.claude/commands
cd ~/dev/zai/.claude/commands
for f in autopilot.md deploy.md eval.md impl.md review.md spec.md; do
  ln -s ~/dev/streettt-private/.claude/commands/$f $f
done
```
Available: `autopilot`, `deploy`, `eval`, `impl`, `review`, `spec`.
Deferred: `implw`, `impl-cleanup`.
```

### Phase 5 — Add permanent rule to all public repo CLAUDE.mds

Add this block at the bottom of `CLAUDE.md` in `zai`, `streettt`, and any future public HTU repo:

```markdown
## Privacy rule — permanent

Sensitive operational details are NEVER committed to public repos:
- Local filesystem paths (`~/dev/...`)
- Command inventories or toolchain invocations
- Symlink structures pointing to private repos
- Internal module paths or test invocations

These belong in `streettt-private` only. Violations are reverted immediately
and the committer must run `git filter-repo` to scrub history.
```

---

## Acceptance Criteria

- [ ] `git log --all -- CLAUDE.md | xargs git show` returns zero matches for `streettt-private`, `~/dev`, `npx tsx`, `autopilot.md`, `symlink` in zai repo
- [ ] Public `zai/CLAUDE.md` contains only governance rules + stubs (≤ 60 lines)
- [ ] `streettt-private/CLAUDE.md` contains full re-run check + command setup
- [ ] Force push completed; daniel-silvers has re-pulled
- [ ] Permanent privacy rule appended to zai CLAUDE.md
- [ ] Two PRs opened (zai + streettt-private) — daniel-silvers reviewer
- [ ] No existing functionality broken — `impl i` still works on scored specs

---

## ⚠️ Pre-execution checklist

Before running Phase 2–3, confirm with daniel-silvers:
- [ ] He has no uncommitted local changes in `~/dev/zai`
- [ ] All open PRs on zai are either merged or rebased post-force-push
- [ ] CF Pages deployment is unaffected (it pulls from the git tree, not history)

---

## Subject Migration Summary

| | |
|---|---|
| What | CLAUDE.md privacy split + git history scrub of sensitive operational details |
| State | Spec complete; needs scoring before impl |
| Open questions | (1) Coordinate timing with daniel-silvers before force push. (2) Any other public HTU repos with similar leakage? Run: `grep -r "~/dev\|streettt-private\|npx tsx" */CLAUDE.md` |
| Next action | Score → impl (coordinate with daniel-silvers on force-push timing) |
| Repos | `zi007lin/zai` (history rewrite) + `streettt-private` (additions) |

---

## Files

```
zi007lin/zai/CLAUDE.md                     ← rewritten (public stub only)
streettt-private/CLAUDE.md                 ← append ZAI Layer 2 sections
```

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T15:26:08.375Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__claude-md-privacy-split.md_
