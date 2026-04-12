Wire streettt-private Layer 2 commands (impl, implw, impl-cleanup) to zi007lin/zai so Claude Code in ~/dev/zai has the same commands as ~/dev/streettt.

Research first:
1. cat ~/dev/streettt/CLAUDE.md | head -40
2. cat ~/.claude/CLAUDE.md 2>/dev/null || echo "No global CLAUDE.md"
3. ls ~/dev/streettt-private/.claude/commands/ 2>/dev/null

Fix: symlink commands from streettt-private into ~/dev/zai/.claude/commands/ — never copy, always symlink so contents stay private.

Also create ~/dev/zai/CLAUDE.md with: repo=zi007lin/zai, reviewer=daniel-silvers, branch naming=zai/<issue-slug>, deploy to dev only.

Verify: cd ~/dev/zai && claude → implw 1 must work.

Acceptance: implw, impl, impl-cleanup all work in ~/dev/zai. streettt-private not exposed.
