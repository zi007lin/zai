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
3. If the heading is absent → STOP. Emit exactly:
   `needs_input: score this spec at dev.zai.htu.io/app first, then re-download the .scored.md`
4. If the heading is present, check that the section contains a line
   matching exactly: `- **Passed:** YES`
   If that line is absent or reads `- **Passed:** NO` → STOP. Emit exactly:
   `needs_input: spec score is not passing — fix failing sections and re-score before impl`
5. If the `- **Passed:** YES` line is present → proceed with impl normally

No exceptions. No overrides. No "I'll proceed anyway since the intent is clear."
A spec without a passing score block is not a valid impl input.

The correct workflow is:
  Write spec → upload to dev.zai.htu.io/app → download .scored.md → run impl on .scored.md

Note: a future update will add a machine-parseable `<!-- zilin-bs:score {json} -->`
block alongside the markdown section. When that ships, update this rule to check
the JSON block instead. Until then, the `## ZAI Spec Score` + `- **Passed:** YES`
pattern is authoritative.

## Layer 2 Commands

Commands in `.claude/commands/` are **symlinks** into `~/dev/streettt-private/.claude/commands/`.
Never copy — always symlink — so private contents stay private.
The `.claude/commands/` directory is gitignored; each developer sets it up locally.

Setup:
```bash
mkdir -p ~/dev/zai/.claude/commands
cd ~/dev/zai/.claude/commands
for f in autopilot.md deploy.md eval.md impl.md review.md spec.md; do
  ln -s ~/dev/streettt-private/.claude/commands/$f $f
done
```

Available: `autopilot`, `deploy`, `eval`, `impl`, `review`, `spec`.

Deferred (not yet in streettt-private): `implw`, `impl-cleanup`.

## Dual-PR Governance

- zi007lin authors PRs; never merges own PRs
- daniel-silvers reviews and merges
- All PRs require AI validation pass + reviewer approval

## Commit Identity

```
git config user.name "ZiLin"
git config user.email "noreply@zzv.io"
```

Never add Co-Authored-By trailers.
