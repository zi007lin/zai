# @htu/zai-mcp

MCP server exposing ZAI's `score_spec` tool over stdio. Score markdown specs against the [ZAI rubric](https://zai.htu.io/) from any MCP-capable LLM client.

## Install (Claude Desktop)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "zai": {
      "command": "npx",
      "args": ["-y", "@htu/zai-mcp"]
    }
  }
}
```

Restart Claude Desktop. The `score_spec` tool now appears in your tool palette.

Cursor, Cline, and other MCP-capable clients accept the same shape — substitute their respective config locations.

## What it does

One tool: `score_spec`. Pass a markdown spec body and a spec type. Get back a structured score per the ZAI rubric: total score, per-check pass/fail, error messages on failures, rubric version. Identical scoring to the [zai.htu.io/app](https://zai.htu.io/app) web UI.

Stateless. Anonymous. Per-process rate-limited (30/min, 200/hr, 1000/day).

## Tool: `score_spec`

**Input:**

```typescript
{
  content: string,           // raw markdown spec body, ≤200KB
  type: "feat" | "bug" | "hotfix" | "spec" | "chore" | "refactor" | "research" | "ux" | "brand",
  bundles?: string[]         // reserved for future rubric bundles
}
```

**Output (success):**

```typescript
{
  score: number,             // count of passing checks
  max: number,               // total checks for this type
  passed: boolean,           // score === max
  type: string,              // echo of input type
  rubric_version: string,    // e.g., "1.3.1"
  checks: Array<{
    name: string,
    pass: boolean,
    error?: string           // present when pass=false
  }>
}
```

**Output (error):**

```typescript
// Bad input
{ error: "invalid_input" | "content_too_large", message: string }

// Rate-limited
{ error: "rate_limited", retry_after_seconds: number, remaining: { ... } }
```

Errors come back as **MCP tool responses** (`isError: true`), not protocol exceptions. The agent can handle them as data.

## Example transcript (Claude Desktop)

> **You:** Use the score_spec tool to score this draft (paste the markdown of `examples/sample-feat.md`) as type `feat`.

> **Claude:** *Calls `score_spec` with the markdown body. Receives:*
> ```json
> { "score": 9, "max": 9, "passed": true, "type": "feat", ... }
> ```
> The spec passes all 9 checks — Intent, Decision Tree, Final Spec, Acceptance Criteria, Game Theory Cooperative review, Subject Migration Summary, Files list, Models Applied, Legal triggers.

See [DEMO.md](./DEMO.md) for more transcripts and [examples/](./examples) for reproducible sample inputs.

## Development

```bash
npm install                  # at zai repo root (uses workspaces)
cd packages/zai-mcp
npm run build                # tsup -> dist/
npm run test                 # vitest unit + integration
npm pack --dry-run           # verify what would publish
```

## License

MIT. See [LICENSE](../../LICENSE) at the zai repo root.
