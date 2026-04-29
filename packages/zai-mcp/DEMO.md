# Demo transcripts

Sample exchanges between an LLM agent and the `score_spec` tool, useful for sales calls, onboarding, and screencast capture.

## Transcript 1 — passing FEAT spec

**Operator:** Claude, score the spec at `examples/sample-feat.md` as type `feat`.

**Claude (tool call):**

```json
{
  "tool": "score_spec",
  "input": {
    "content": "<contents of examples/sample-feat.md>",
    "type": "feat"
  }
}
```

**Tool response:**

```json
{
  "score": 9,
  "max": 9,
  "passed": true,
  "type": "feat",
  "rubric_version": "1.3.1",
  "checks": [
    { "name": "Intent", "pass": true },
    { "name": "Decision Tree", "pass": true },
    { "name": "Final Spec", "pass": true },
    { "name": "Acceptance Criteria", "pass": true },
    { "name": "Game Theory Cooperative review", "pass": true },
    { "name": "Subject Migration Summary", "pass": true },
    { "name": "Files created / updated", "pass": true },
    { "name": "Models Applied", "pass": true },
    { "name": "Legal triggers", "pass": true }
  ]
}
```

**Claude:** All 9 ZAI FEAT rubric checks passed. The spec is cleared to ship.

## Transcript 2 — failing spec, agent reports per-check failures

**Operator:** Score this draft as type `feat`. *(pastes a draft missing Models Applied and Legal triggers sections)*

**Tool response (truncated):**

```json
{
  "score": 7,
  "max": 9,
  "passed": false,
  "type": "feat",
  "rubric_version": "1.3.1",
  "checks": [
    { "name": "Intent", "pass": true },
    { "name": "Decision Tree", "pass": true },
    { "name": "Models Applied", "pass": false, "error": "Section heading '## Models Applied' not found" },
    { "name": "Legal triggers", "pass": false, "error": "Section heading '## Legal triggers' not found" }
  ]
}
```

**Claude:** Two sections are missing: **Models Applied** and **Legal triggers**. Add `## Models Applied` listing the canonical models you applied, and `## Legal triggers` listing any compliance/contract triggers (or "None"). Re-score after.

## Transcript 3 — invalid input

**Operator:** Score this with type `urgent`.

**Tool response:**

```json
{
  "error": "invalid_input",
  "message": "type must be one of: feat, bug, hotfix, spec, chore, refactor, research, ux, brand"
}
```

**Claude:** `urgent` isn't a valid spec type. Did you mean `hotfix`?

## Transcript 4 — rate-limited

**Operator:** *(after 30 calls within a minute)* Score this one too.

**Tool response:**

```json
{
  "error": "rate_limited",
  "retry_after_seconds": 47,
  "remaining": { "minute": 0, "hour": 170, "day": 970 }
}
```

**Claude:** Per-minute rate limit reached. Retry in ~47 seconds.

## Recording a screencast

For PR submissions and sales decks:

1. Install the package locally: `cd packages/zai-mcp && npm run build && npm link`
2. Add the Claude Desktop config snippet from README.md (use `command: "node"`, `args: ["/abs/path/to/dist/index.js"]` for the linked version)
3. Restart Claude Desktop
4. Open a chat and ask: *"Score the spec at `~/path/to/examples/sample-feat.md` as type feat using the score_spec tool"*
5. Record the response (≈30 s)

The exchange should show the tool call, the structured response, and Claude's interpretation. That's the demo.
