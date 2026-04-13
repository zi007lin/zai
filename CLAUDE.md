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
3. If absent → STOP. Emit exactly:
   `needs_input: score this spec at dev.zai.htu.io/app first, then re-download the .scored.md`
4. If present, check for `- **Passed:** YES`. If that line is absent or reads
   `- **Passed:** NO` → STOP. Emit exactly:
   `needs_input: spec score is not passing — fix failing sections and re-score before impl`
5. If passed → run the score integrity check per the Layer 2 impl command
   (implementation in the private layer).

No exceptions. No overrides. No "I'll proceed anyway since the intent is clear."
A spec without a passing, accurate score block is not a valid impl input.

The correct workflow:
  Write spec → upload to dev.zai.htu.io/app → download .scored.md → run impl on .scored.md

Note: the re-run integrity check (Option B) is superseded by CF Worker signature
verification (Option A) once `SCORE_SIGNING_KEY` is live on the runner. See
`issues/parked/2026-04-13__feat__zai-score-signing-cf-worker.md`.

### Gate 1 — spec approval

Before impl runs, every spec is classified:

- **Trivial** (`chore` 2/2, `hotfix` 3/3, no gates listed in the score block):
  AUTO — proceeds immediately
- **Non-trivial** (`feat`, `bug`, `research`, or any spec with one or more items
  in `gates[]`, or any spec referencing a force-push / history rewrite /
  destructive operation): HOLD — daniel-silvers approves the GitHub issue
  before ZiLin-Dev reads it

See the private layer for the full classifier implementation.

Solo operator: ZiLin may self-approve non-trivial specs via session reply
`approved` or label removal. PR review at merge is always required.
See the private layer for the full solo-operator rule.

## Layer 2 Commands

Implementation details live in the private layer (never in this public repo).
Run `impl i <scored-spec.md>` to execute any scored spec. The command
orchestrates the full impl workflow — branch, test, PR, review gate —
and performs the score integrity check before touching any file.

## Dual-PR Governance

- zi007lin authors PRs; never merges own PRs
- daniel-silvers reviews and merges
- All PRs require AI validation pass + reviewer approval

## Commit Identity

```
git config user.name "ZiLin"
git config user.email "noreply@zzv.io"
```

Never add `Co-Authored-By` trailers.

---

## Privacy rule — permanent

Sensitive operational details are NEVER committed to public repos:

- Local filesystem paths (`~/dev/...`)
- Command inventories or toolchain invocations
- Symlink structures pointing to private repos
- Internal module paths or test invocations
- Public IPs, hostnames, or server or provider identifiers for internal infrastructure

These belong in the private layer only. Violations are reverted immediately
and the committer must run `git filter-repo` to scrub history (coordinate
with the admin — force-push required).

Public repos contain governance rules and stubs only. No exceptions.
