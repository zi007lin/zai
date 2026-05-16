# FEAT: Enable dispatch when Repo header is present

**Repo:** zi007lin/zai

## Intent

Minimal FEAT fixture exercising the enabled-state path of the ZAI
dispatch flow. Carries a valid `**Repo:** owner/repo` line between the
H1 and `## Intent` so the ScorePanel's "Run impl →" button renders
enabled and `aria-describedby` is omitted. Pair with
`example-feat-fixed.md` (which omits the header in the canonical
upstream fixture) to exercise both sides of BUG #97's disabled-state
gating. Fixture stays under the FEAT word cap and asserts no behavior
beyond enabling the dispatch button.

## Action

1. Upload this file into the ZAI scorer.
2. Wait for the score panel to render.
3. Observe the "Run impl →" button renders enabled with no
   disabled-state hint beneath it.

## Acceptance Criteria

- [ ] The "Run impl →" button renders without the `disabled` attribute.
- [ ] No element with `data-testid="run-impl-missing-repo"` appears.
- [ ] No `aria-describedby` attribute is present on the button.

## Files

```
test/fixtures/example-with-repo-header.md   (NEW — this file)
```

## Legal triggers

None. Test fixture only; never deployed to a runtime.

## Work Estimate

### Active operator time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Upload fixture and observe button | None | 1 min |
| Total | | 1 min |

### Wall-clock time

| Phase | Wait dependency | Estimate |
|---|---|---|
| Manual verification | None | 1 min |
| Total | | 1 min |

### Assumptions

- ZAI dev or local build carries the BUG #97 changes.
- The scorer accepts a FEAT spec with the canonical sections present.
