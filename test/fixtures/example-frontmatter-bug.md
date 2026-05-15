---
spec_type: bug
title: Frontmatter-resolved BUG spec for detector fallback test
---

# Some non-prefixed H1 that the H1 fallback regex will not match

**Repo:** zi007lin/zai

## Intent

A minimal BUG spec used to verify the detector's frontmatter fallback.
This file has no canonical filename prefix and no H1 that starts with
a type token — `spec_type: bug` in YAML frontmatter is the only signal
the detector can use. The scoring rubric itself is irrelevant for this
fixture; what matters is that detection resolves to `bug` with source
`frontmatter`.

## Repro

Upload this file via the web UI with a non-canonical filename.

## Fix

Detector tries filename → fails. Tries H1 → fails. Reads frontmatter
and resolves `spec_type: bug`.

## Acceptance Criteria

- [ ] Detector returns `{ type: "bug", source: "frontmatter" }`.
- [ ] No `Uncaught (in promise)` is thrown.

## Subject Migration Summary

| Subject          | Before                | After                              |
|------------------|-----------------------|------------------------------------|
| Resolution path  | Filename only         | Filename → H1 → frontmatter        |
| Open questions   | none                  |                                    |

## Files

```
test/fixtures/example-frontmatter-bug.md   (NEW)
```

## Legal triggers

None.

## Work Estimate

### Active operator time

| Phase   | Wait dependency | Estimate |
|---------|-----------------|----------|
| Fixture | None            | 5 min    |
| Total   |                 | 5 min    |

### Wall-clock time

| Phase   | Wait dependency | Estimate |
|---------|-----------------|----------|
| Fixture | None            | 5 min    |
| Total   |                 | 5 min    |

### Assumptions

- Detector tests run from the repo root.

### Actuals (filled post-execution)

| Phase   | Estimate | Actual | Delta |
|---------|----------|--------|-------|
| Fixture | 5 min    | TBD    | TBD   |
| Total   | 5 min    | TBD    | TBD   |
