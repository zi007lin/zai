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
5. If the `- **Passed:** YES` line is present → **continue with the re-run integrity check below.**

### Score integrity — re-run check (Option B)

Steps 1–4 confirm the score block is *present* and *claims* passed.
This check confirms the score block is *accurate*.

6. Extract the spec content: everything above the `## ZAI Spec Score`
   heading. That slice is what the original scorer saw.

7. Re-run the rubric against the extracted content:
   - Detect spec type from the filename prefix
     (`YYYY-MM-DD__TYPE__title.md`)
   - Evaluate all required sections for that type
   - Compute live `spec_type`, `score` (N/M), and `passed` (true/false)

   Reference invocation (zai repo):
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
   For streettt-private: until `htu-foundation/tools/zilin-bs/` exists,
   perform the re-run inline using the same structural regex checks
   documented at `zi007lin/zai/src/lib/scoreSpec.ts`.

8. Compare live result against the stored score block in the file:
   - If `live.passed !== stored.passed` → STOP. Emit exactly:
     `needs_input: score block mismatch — stored says {stored.passed}, live re-run says {live.passed}. Re-score at dev.zai.htu.io/app`
   - If `live.score !== stored.score` → STOP with the same mismatch message
   - If `live.spec_type !== stored.spec_type` → STOP. Emit exactly:
     `needs_input: spec type mismatch — stored says {stored.spec_type}, filename indicates {live.spec_type}. Re-score at dev.zai.htu.io/app`
   - If all three match → **proceed with impl.**

9. This check runs on every `impl` invocation, not just the first.
   A spec that was valid yesterday may fail today if the rubric is
   updated. Re-score and re-download whenever the rubric version
   changes (track `scoreSpec.ts::RUBRIC_VERSION` on zai).

No exceptions. No overrides. No "I'll proceed anyway since the intent is clear."
A spec without a passing, accurate score block is not a valid impl input.

The correct workflow is:
  Write spec → upload to dev.zai.htu.io/app → download .scored.md → run impl on .scored.md

Note: the re-run check above (Option B) is superseded by cryptographic
signature verification (Option A) once the CF Worker score-signing
infrastructure ships — see `issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md`.
When a `SCORE_SIGNING_KEY` secret is present in the runner environment,
skip steps 6–9 and use signature verification instead.

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
