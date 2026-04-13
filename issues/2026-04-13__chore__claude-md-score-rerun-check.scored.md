# 2026-04-13__chore__claude-md-score-rerun-check

**Repos:** `streettt-private` + `zi007lin/zai`
**Label:** `chore`
**Branch:** `stt/claude-md-score-rerun-check` / `zai/claude-md-score-rerun-check`
**Reviewer:** daniel-silvers
**Superseded by:** `2026-04-13__feat__zai-score-signing-cf-worker.md` once CF Worker ships

---

## Intent

Close the hand-typing attack on the score gate. The current CLAUDE.md rule checks for the presence of `"passed": true` in the score block — but anyone can type that string. This amendment makes ZiLin-Dev re-run the rubric live against the spec content before impl, then compare the result against the stored score block. If they disagree, impl stops. Eliminates all manual insertion and auto-injection attacks with zero new infrastructure.

---

## Files

```
streettt-private/CLAUDE.md   ← append re-run check to score gate section
zi007lin/zai/CLAUDE.md       ← append re-run check to score gate section
```

---

## Exact amendment

In each CLAUDE.md, find the existing "Hard Rules — impl gate" section. Append the following immediately after the current step 4 (proceed normally):

```markdown
### Score integrity — re-run check (Option B)

Steps 1–4 confirm the score block is *present* and *claims* passed.
This step confirms the score block is *accurate*.

5. Extract the spec content (everything above the `<!-- zilin-bs:score`
   comment block).

6. Re-run the rubric against the extracted content:
   - Detect spec type from filename prefix
   - Evaluate all required sections for that type
   - Compute expected score (N/M) and passed (true/false)

7. Compare live result against stored score block:
   - If `live.passed !== stored.passed` → STOP:
     `needs_input: score block mismatch — stored says {stored.passed},
     live re-run says {live.passed}. Re-score at dev.zai.htu.io/app`
   - If `live.score !== stored.score` → STOP with same message
   - If `live.spec_type !== stored.spec_type` → STOP:
     `needs_input: spec type mismatch — stored says {stored.spec_type},
     filename indicates {live.spec_type}. Re-score at dev.zai.htu.io/app`
   - If all match → proceed with impl

8. This check runs on every impl invocation, not just the first.
   A spec that was valid yesterday may fail today if the rubric is
   updated. Re-score and re-download whenever the rubric version changes.

Note: This check (Option B) is superseded by cryptographic signature
verification (Option A) once the CF Worker score-signing infrastructure
ships. When SCORE_SIGNING_KEY is present in the environment, skip steps
5–8 and use signature verification instead.
```

---

## Implementation note for ZiLin-Dev

The re-run check uses the same rubric logic already present in:
- `src/lib/scoreSpec.ts` (zai repo — browser bundle)
- `tools/zilin-bs/classify-spec.ts` (htu-foundation — not yet built)

For the zai repo: ZiLin-Dev can invoke the rubric check by running:
```bash
cd ~/dev/zai && npx tsx -e "
  import { scoreSpec } from './src/lib/scoreSpec.ts';
  import { readFileSync } from 'fs';
  const content = readFileSync(process.argv[1], 'utf8');
  const filename = process.argv[1].split('/').pop();
  const result = scoreSpec(content, filename);
  console.log(JSON.stringify(result));
" <spec-file-path>
```

For streettt-private: until `htu-foundation/tools/zilin-bs/classify-spec.ts` is built, ZiLin-Dev performs the re-run check using the same structural regex checks inline (heading presence, table presence, string matching). The logic is simple enough to re-implement inline without a dependency.

---

## Acceptance Criteria

- [ ] CLAUDE.md in both repos contains the re-run check (steps 5–8)
- [ ] `impl i` on a spec where stored score says `7/7 PASS` but live re-run detects a missing Decision Tree → stops with mismatch message
- [ ] `impl i` on a spec where stored spec_type is `feat` but filename is `__research__` → stops with type mismatch message
- [ ] `impl i` on a correctly scored spec where live re-run matches stored → proceeds normally
- [ ] Note about Option A superseding Option B is present in both CLAUDE.mds
- [ ] Two PRs opened — one per repo — daniel-silvers reviewer

---

## Subject Migration Summary

| | |
|---|---|
| What | Score integrity re-run check — eliminates hand-typing and auto-injection attacks |
| State | Spec complete; needs scoring before impl |
| Open questions | The `npx tsx` invocation for re-run in zai — confirm `tsx` is available on Contabo runner (`which tsx`) |
| Next action | Score at `/app` → download `.scored.md` → `impl i` |
| Repos | `streettt-private` + `zi007lin/zai` |

---

## ZAI Spec Score

- **Rubric version:** 1.1.0
- **Spec type:** chore
- **Evaluated at:** 2026-04-13T07:02:10.334Z
- **Score:** 2/2
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| files_list | PASS |

_Source: 2026-04-13__chore__claude-md-score-rerun-check.md_
