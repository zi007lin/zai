# 2026-04-13__hotfix__claude-md-score-gate-pattern

**Repos:** `streettt-private` + `zi007lin/zai`
**Label:** `hotfix`
**Branch:** `stt/hotfix-claude-md-score-gate-pattern` / `zai/hotfix-claude-md-score-gate-pattern`
**Reviewer:** daniel-silvers
**Fixes:** `2026-04-13__chore__claude-md-score-gate` (PR #26 / PR #19)

## Intent

Fix the score gate pattern in both CLAUDE.mds. The gate was written against a planned `<!-- zilin-bs:score -->` HTML comment format that was never implemented in `buildScoredSpec()`. The live scorer at `dev.zai.htu.io/app` emits a markdown section (`## ZAI Spec Score`) with a `- **Passed:** YES` line. The rule as merged rejects every valid scored spec because the pattern it searches for does not exist in any real output. This hotfix corrects the pattern to match reality.

## Repro

```
impl i 2026-04-13__chore__park-score-signing-issue.scored.md
→ needs_input: score this spec at dev.zai.htu.io/app first
```

File contains `## ZAI Spec Score` + `- **Passed:** YES` — correctly scored.
File does not contain `<!-- zilin-bs:score` — rule rejects it incorrectly.

## Fix

In each CLAUDE.md, find the "Hard Rules — impl gate" section. Replace the two affected steps:

**Current (wrong):**
```markdown
2. Search for the pattern: `<!-- zilin-bs:score`
...
4. If the block is present, parse the JSON and check `"passed": true`
```

**Replace with:**
```markdown
2. Search for the pattern: `## ZAI Spec Score` (exact heading, case-sensitive)

3. If the heading is absent → STOP. Emit exactly:
   `needs_input: score this spec at dev.zai.htu.io/app first, then re-download the .scored.md`

4. If the heading is present, check that the section contains a line
   matching exactly: `- **Passed:** YES`
   If that line is absent or reads `- **Passed:** NO` → STOP. Emit exactly:
   `needs_input: spec score is not passing — fix failing sections and re-score before impl`
```

No other changes to the gate rule. Steps 1, 5, 6, 7 (where present) are unchanged.

## Future compatibility note

Add the following sentence at the end of the gate section in both CLAUDE.mds:

```markdown
Note: a future update will add a machine-parseable `<!-- zilin-bs:score {json} -->`
block alongside the markdown section. When that ships, update this rule to check
the JSON block instead. Until then, the `## ZAI Spec Score` + `- **Passed:** YES`
pattern is authoritative.
```

## Acceptance Criteria

- [ ] `streettt-private/CLAUDE.md` gate pattern updated to `## ZAI Spec Score` + `- **Passed:** YES`
- [ ] `zi007lin/zai/CLAUDE.md` gate pattern updated to `## ZAI Spec Score` + `- **Passed:** YES`
- [ ] Future compatibility note added to both CLAUDE.mds
- [ ] `impl i` on `2026-04-13__chore__park-score-signing-issue.scored.md` proceeds without `needs_input`
- [ ] `impl i` on a plain unscored `.md` still stops with correct `needs_input` message
- [ ] `impl i` on a scored spec with `- **Passed:** NO` still stops with correct `needs_input` message
- [ ] Two PRs — one per repo — daniel-silvers reviewer

## Subject Migration Summary

| | |
|---|---|
| What | Score gate pattern fix — `<!-- zilin-bs:score` → `## ZAI Spec Score` + `- **Passed:** YES` |
| State | Spec complete; needs scoring before impl |
| Root cause | `buildScoredSpec()` in PR #15 emits markdown section; gate rule was written against planned HTML comment format that was never implemented |
| Open questions | None |
| Next action | Score at `/app` → download `.scored.md` → `impl i` |
| Repos | `streettt-private` + `zi007lin/zai` |

## Files

```
streettt-private/CLAUDE.md  ← pattern fix + future compat note
zi007lin/zai/CLAUDE.md      ← pattern fix + future compat note
```

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** hotfix
- **Evaluated at:** 2026-04-13T07:13:19.906Z
- **Score:** 3/3
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| fix | PASS |
| files_list | PASS |

_Source: 2026-04-13__hotfix__claude-md-score-gate-pattern.md_
