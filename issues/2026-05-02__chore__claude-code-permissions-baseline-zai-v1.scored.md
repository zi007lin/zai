# CHORE: Claude Code permissions baseline — zi007lin/zai

**Target:** zi007lin/zai
**Type:** chore
**Author:** zi007lin
**Approver:** daniel-silvers
**Date:** 2026-05-02
**Tracker:** #42 (htu-foundation) — sibling-repo fan-out (1 of 5)
**Sibling reference:** PR #44 in htu-foundation (closed; merged commit `4b704f1`)

---

## Intent

Roll out the Claude Code permissions baseline to `zi007lin/zai`, mirroring the htu-foundation pattern landed in PR #44. Add a committed `.claude/settings.json` with zai-specific build/deploy commands allowed (wrangler, dev/demo/full deploys, impl/implw), a personal `.claude/settings.local.json` ignored from git, a `.gitignore` entry for the local file, and a `## Claude Code permissions` section in `CLAUDE.md` explaining the layering. The global `~/.claude/settings.json` (already in place from PR #44) covers cross-repo safe operations; this CHORE adds only zai-specific overlay.

---

## Action

1. **Branch** `htu/chore-claude-permissions-baseline-zai` from `main` after `git pull`.
2. **Create `.claude/settings.json`** (committed) with zai-specific allow patterns: `npm run dev*`, `npm run deploy:dev*`, `npm run deploy:demo*`, `npm run deploy:full*`, `npx wrangler pages deploy*`, `npx wrangler pages project list*`, `npx wrangler d1 *`, `impl i *`, `implw *`. No new deny rules — global file already covers `rm -rf`, `git push`, `sudo`, `npm publish`, `.env` reads.
3. **Create `.claude/settings.local.json`** as an empty `{ "permissions": { "allow": [], "deny": [] } }` placeholder; this file is gitignored and used for personal experimentation.
4. **Update `.gitignore`**: add `.claude/settings.local.json` if not already present.
5. **Update `CLAUDE.md`**: add `## Claude Code permissions` section documenting the two-file layering convention (global → committed `.claude/settings.json` → personal `.claude/settings.local.json`), with a pointer to `htu-foundation/docs/dev-environment/claude-code-permissions.md` as the canonical reference.
6. **Commit `issues/2026-05-02__chore__claude-code-permissions-baseline-zai-v1.scored.md`** as part of the same PR (audit artifact convention established by PRs #44, #45, #47, #49).
7. **Push** the branch (human-typed per dual-control deny rule). Open PR against `main` with body referencing tracker #42 (htu-foundation).
8. **Verify** by running `gh issue view 42 --repo zi007lin/htu-foundation --json body` and editing #42 body to flip `[ ] zi007lin/zai` checkbox to `[x]` after this PR merges.

---

## Acceptance Criteria

- [ ] Branch `htu/chore-claude-permissions-baseline-zai` exists and tracks origin.
- [ ] `.claude/settings.json` exists in zai with the allow patterns listed in §Action #2.
- [ ] `.claude/settings.local.json` exists with empty allow/deny placeholders.
- [ ] `.gitignore` contains `.claude/settings.local.json`.
- [ ] `CLAUDE.md` has a `## Claude Code permissions` section pointing to the htu-foundation reference doc.
- [ ] `issues/2026-05-02__chore__claude-code-permissions-baseline-zai-v1.scored.md` is committed in the same PR.
- [ ] Running `npx wrangler pages project list`, `npm run dev`, `npm run deploy:dev` does not prompt in this repo after the baseline lands (verified during agent execution).
- [ ] No `Bash:*` (blanket allow) anywhere in either settings file.
- [ ] PR body references tracker `#42 (htu-foundation)` and links to the original PR `#44`.
- [ ] After merge, `#42` body has the `zi007lin/zai` checkbox flipped to `[x]`.
- [ ] CI on zai (lint/test/build per zai's existing config) passes — no functional code change so this is trivial.

---

## Subject Migration Summary

| Subject | Before | After |
|---|---|---|
| zai bash-permission prompts | Prompt on every `npx wrangler`, `npm run deploy:*`, `impl i` invocation | Auto-allowed via committed `.claude/settings.json` |
| zai-specific patterns | Scattered across session memory; re-trained per session | Encoded in `.claude/settings.json` |
| Cross-repo consistency | htu-foundation has the convention; zai does not | Convention applied uniformly |
| Sensitive-path enforcement | Inherited from global `~/.claude/settings.json` | Same; no new repo-level deny rules needed (zai has no `env/` or `infrastructure/` privacy boundary like streettt-private) |
| Discoverability for new contributors | None — convention not documented in zai | `CLAUDE.md` references the canonical doc in htu-foundation |
| #42 tracker progress | 1 of 6 surfaces complete (htu-foundation + global) | 2 of 6 surfaces complete (adds zai) |
| Open questions | — | Whether the wrangler patterns should be split between dev and prod deploy commands — defer to first friction event |

---

## Files created / updated

```
.claude/settings.json                                                          (NEW, committed)
.claude/settings.local.json                                                    (NEW, gitignored placeholder)
.gitignore                                                                     (UPDATED, add .claude/settings.local.json)
CLAUDE.md                                                                      (UPDATED, add ## Claude Code permissions)
issues/2026-05-02__chore__claude-code-permissions-baseline-zai-v1.scored.md    (NEW, audit artifact)
```

No source code changes. No dependency changes. No CI/build/test changes.

### `.claude/settings.json` content

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run dev*)",
      "Bash(npm run deploy:dev*)",
      "Bash(npm run deploy:demo*)",
      "Bash(npm run deploy:full*)",
      "Bash(npx wrangler pages deploy*)",
      "Bash(npx wrangler pages project list*)",
      "Bash(npx wrangler d1 *)",
      "Bash(npx wrangler r2 *)",
      "Bash(npx wrangler kv *)",
      "Bash(impl i *)",
      "Bash(implw *)"
    ],
    "deny": []
  }
}
```

### `.claude/settings.local.json` content (placeholder)

```json
{
  "permissions": {
    "allow": [],
    "deny": []
  }
}
```

### `CLAUDE.md` snippet to append

```markdown
## Claude Code permissions

This repo uses the layered permissions convention established in `htu-foundation/docs/dev-environment/claude-code-permissions.md`:

- **Global** (`~/.claude/settings.json`): cross-repo safe ops + global denies (`rm -rf`, `git push`, `sudo`, `npm publish`, `.env` reads).
- **Committed** (`.claude/settings.json` here): zai-specific allowlist for build/deploy commands.
- **Personal** (`.claude/settings.local.json`, gitignored): per-developer experimentation.

To add a new pattern permanently for zai, append to the committed file. To experiment locally, append to the local file.
```

---

## Legal triggers

None. Dev-environment configuration only. No contract, license, PHI, PAN, liability, royalty, compensation, arbitration, or third-party data-handling implications. No public-facing surface changes. No telemetry or data flow changes. The zai repo's `zai.htu.io/app` deployment surface is not affected by this CHORE.

---

## Work Estimate

### Active operator time

| Phase | Estimate | Notes |
|---|---|---|
| Spec drafting | 8 min | This CHORE; reuses the htu-foundation pattern |
| ZAI scoring + iteration | 5 min | Single pass expected at v1.4.0 |
| `gh issue create` in zai | 1 min | |
| `implw <n>` invocation | 1 min | |
| Diff review on 4 file changes + 1 new file | 3 min | All small; pattern is established |
| Approve agent's lint + test + build runs | 2 min | zai has its own CI; trivial pass expected |
| Manual `git push` (deny-rule) | 1 min | Dual-control |
| `gh pr create` + populate body | 2 min | Reference tracker #42 + sibling PR #44 |
| daniel-silvers review prep | 1 min | |
| Approve PR + merge | 2 min | |
| Edit #42 body, flip zai checkbox to `[x]` | 1 min | `gh issue edit 42 --repo zi007lin/htu-foundation --body-file ...` |
| **Total active** | **27 min** | |

### Wall-clock time

| Wait dependency | Estimate | Notes |
|---|---|---|
| Operator availability | 0 min | Solo author |
| ZAI scoring | 10 sec | Sub-5-second SLA |
| Claude Code execution | 5 min | `implw` for 4 file edits + 1 new audit-artifact file |
| CI runtime (zai) | 4 min | zai has lighter CI than htu-foundation |
| daniel-silvers review | 30 min - 12 hr | Variable; trivial PR likely fast |
| Network operation | 1 min | push, pr create, issue edit |
| **Total wall-clock** | **~45 min to ~13 hr** | Bounded by review pacing |

### Assumptions

- zai's current `main` has no `.claude/` directory (or has one with no `settings.json`). Verified by `ls /home/zilin/dev/zai/.claude/` before branching.
- zai's CI does not require `.claude/` files to exist or to follow a specific schema.
- zai's `CLAUDE.md` exists; if it does not, the spec falls back to creating it.
- zai uses the same `htu/<slug>` branch convention as htu-foundation per recent reconciliation (#25 / #36 era).
- The wrangler subcommands listed (`pages`, `d1`, `r2`, `kv`) reflect actual zai dev/deploy patterns. If `r2` or `kv` are not used in zai, they are still safe to allow (no friction added; pattern future-proofs the next time they're needed).
- daniel-silvers has full access to `zi007lin/zai` (zai is public; not gated like htu-governance).
- No PR currently in flight against zai conflicts on `.gitignore` or `CLAUDE.md`.
- The htu-foundation reference doc at `docs/dev-environment/claude-code-permissions.md` exists and is the canonical source (landed in PR #44).
- Global `~/.claude/settings.json` is already in place from PR #44 and contains the cross-repo safe ops + global denies.

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Spec drafting | 8 min | TBD | TBD | |
| ZAI scoring + iteration | 5 min | TBD | TBD | |
| `gh issue create` in zai | 1 min | TBD | TBD | |
| `implw <n>` invocation | 1 min | TBD | TBD | |
| Diff review | 3 min | TBD | TBD | |
| Approve lint + test + build | 2 min | TBD | TBD | |
| Manual `git push` | 1 min | TBD | TBD | |
| `gh pr create` + body | 2 min | TBD | TBD | |
| daniel-silvers review prep | 1 min | TBD | TBD | |
| Approve PR + merge | 2 min | TBD | TBD | |
| Edit #42 body, flip checkbox | 1 min | TBD | TBD | |
| **Total** | **27 min** | **TBD** | **TBD** | |

---

## Run locally (optional)

```bash
# WSL: copy the scored spec into the zai issues directory
cp /mnt/c/Users/zilin/Downloads/2026-05-02__chore__claude-code-permissions-baseline-zai-v1.scored.md \
   /home/zilin/dev/zai/issues/

cd /home/zilin/dev/zai
gh issue create \
  --repo zi007lin/zai \
  --title "CHORE: Claude Code permissions baseline (zai)" \
  --body-file issues/2026-05-02__chore__claude-code-permissions-baseline-zai-v1.scored.md \
  --label chore,dev-environment

# Note returned issue number, then:
implw <issue-number>

# After PR merges, flip the tracker checkbox:
gh issue view 42 --repo zi007lin/htu-foundation --json body --jq .body > /tmp/42-body.md
# Edit /tmp/42-body.md to change "[ ] `zi007lin/zai`" to "[x] `zi007lin/zai`"
gh issue edit 42 --repo zi007lin/htu-foundation --body-file /tmp/42-body.md
```

---

## ZAI Spec Score

- **Rubric version:** 1.4.0
- **Spec type:** chore
- **Evaluated at:** 2026-05-02T15:52:57.846Z
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

_Source: 2026-05-02__chore__claude-code-permissions-baseline-zai-v1.md_
