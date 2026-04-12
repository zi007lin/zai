# CLAUDE.md — ZAI

**Repo:** zi007lin/zai
**Reviewer:** daniel-silvers
**Branch naming:** `zai/<issue-slug>`
**Deploy target:** dev only

ZAI — Zero Ambiguity Intelligence. The engine of Spec Driven Development by High Tech United.

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
