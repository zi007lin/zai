# 2026-04-28 · feat · ZAI MCP server (demo subset, score_spec only) — v1

## Intent

Build a minimum-viable MCP server for ZAI that exposes a single tool, `score_spec`, callable via stdio transport from Claude Desktop, Cursor, Cline, and other MCP-capable LLM agents. The tool accepts a markdown spec body and a spec type, runs ZAI's existing rubric scoring engine in-process, and returns the structured score (per-check pass/fail with error messages). No authentication. No state mutation. Anonymous-only with per-IP rate limiting via existing ZAI infrastructure. Goal: enable live demonstrations of AI-driven spec-first development to prospective C2C clients within days, not weeks. Subset of the parent SPEC `2026-04-28__spec__zai-mcp-server-v1` (to be drafted separately); other tools deferred until a buyer asks for them.

## Decision Tree

| Question | Options | Chosen | Why |
|---|---|---|---|
| Transport | stdio only / streamable-HTTP / both | stdio only | Claude Desktop, Cursor, Cline all support stdio first; no remote deployment complexity; ships fastest |
| Tools exposed | many / a few / one | one (`score_spec`) | Minimum demoable surface; matches the existing "drop a spec, see it scored" magic moment |
| Authentication | passkey / API token / anonymous | anonymous | Caller identity is the LLM client (Claude Desktop user); no need for separate auth in v1 |
| Rate limiting | per-IP / per-process / none | per-IP via existing ZAI rate limiter | Reuses existing infra; prevents abuse; no new code path |
| Implementation language | Python / TypeScript / Go | TypeScript | zai repo is TS; reuse the existing rubric scoring code unchanged |
| MCP SDK | official Anthropic / community | `@modelcontextprotocol/sdk` (official) | Stable, well-documented, owned by Anthropic, reduces drift risk |
| State storage | none / D1 / KV | none | Stateless function call; no persistence needed in v1 |
| Distribution | npm package / Docker image / both | npm package only for v1 | Stdio is process-spawn; Claude Desktop launches `npx zai-mcp`; Docker can be added later if Streamable-HTTP becomes needed |
| Versioning of returned scores | numeric only / structured / structured + raw | structured: `{score, max, type, checks[{name, pass, error?}], rubric_version}` | Enables LLM agents to reason about specific failures; future-compatible with rubric updates |
| Error model | throw on bad input / return error in payload | return error in payload | MCP protocol prefers tool errors as data, not exceptions; agent can handle gracefully |

### Trigger for change

Bump to v2 when any of the following becomes true:
- A buyer asks for `file_issue`, `draft_spec`, or `trigger_implw` during a demo (file `feat__zai-mcp-write-tools-v1` per the parent SPEC)
- Streamable-HTTP transport becomes needed (remote deployment, server-side hosted MCP)
- ZAI rubric versioning changes shape (rare, per the parent SPEC)
- More than one buyer reports the score JSON shape doesn't fit their LLM's tool-use parser

## Draft-of-thoughts

The temptation is to build a "real" MCP server with auth, multiple tools, and persistence. That's a 5-7 week investment that doesn't pay off until weeks 5-7. Wrong tradeoff for a hungry-consultant timeline.

The minimum demoable subset is exactly one tool: `score_spec`. With that one tool, a buyer in a 15-minute demo sees: (a) the methodology has structure (rubric exists, scores are deterministic), (b) AI agents can drive it programmatically (Claude Desktop calls the MCP tool, watches the score come back), (c) integration is a one-line config in any MCP-capable client. Everything else the buyer cares about — file creation, PR opening, pipeline triggering — can be discussed verbally ("we can wire that next, here's the architecture"), not demonstrated.

Stateless + anonymous + stdio reduces this to: one TypeScript file (~200 lines), one npm package, one README, one Claude Desktop config snippet. Implementable in hours, not weeks. ZiLin-Dev can ship this today.

The risk of starting narrow is that v1 looks toy-like to a sophisticated buyer. Mitigation: the demo flow ends with verbal walkthrough of the parent SPEC architecture (showing this is intentionally a demo subset, not the limit of the offering). Buyers who want production-grade get pointed at the parent SPEC's roadmap.

## Final Spec

### Package

- npm package name: `@htu/zai-mcp` (scope reserved or registered as part of this work)
- Binary entry: `zai-mcp` (stdio MCP server)
- Public installation: `npx -y @htu/zai-mcp` (no install step required for end users)

### Tool: `score_spec`

Input schema:

```typescript
{
  content: string,          // raw markdown spec body, ≤200KB
  type: 'feat' | 'bug' | 'spec' | 'chore' | 'refactor' | 'ux' | 'brand',
  bundles?: string[]        // optional: ['healthcare', 'fintech', etc.] per existing ZAI bundle catalog
}
```

Output schema:

```typescript
{
  score: number,            // count of passing checks
  max: number,              // total checks for this type+bundles
  passed: boolean,          // score === max
  type: string,             // echo of input type
  rubric_version: string,   // e.g., "v1.3.1"
  checks: Array<{
    name: string,           // e.g., "Intent", "Game Theory Cooperative"
    pass: boolean,
    error?: string          // present when pass=false
  }>,
  models_applied?: Array<{  // optional, per FEAT/REFACTOR rubric items
    id: number,
    name: string,
    declared: boolean,
    detected: boolean,
    status: 'green' | 'yellow' | 'red'
  }>,
  warnings?: string[]       // e.g., from Legal triggers keyword scan
}
```

### Rate limit

Per remote-IP (extracted from MCP client connection metadata when available; falls back to per-process limit when stdio with no IP):

- 30 calls per minute per IP
- 200 calls per hour per IP
- 1000 calls per day per IP

Exceeded → tool returns `{ error: "rate_limited", retry_after_seconds: N }` as a normal MCP tool response (not a transport error).

### No persistence

The MCP server retains no state between calls. No logging of spec content. No caching of results. Reuses the existing ZAI scoring code path which is already pure-function.

### Claude Desktop config snippet (delivered in README)

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

User adds to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent. Restart Claude Desktop. Tool appears.

## Acceptance Criteria

- [ ] `npx -y @htu/zai-mcp` starts an MCP server that responds to `initialize`, `tools/list`, and `tools/call` per MCP protocol spec
- [ ] `tools/list` returns exactly one tool, `score_spec`, with the input schema above
- [ ] `tools/call score_spec` with valid input returns a structured response matching the output schema above
- [ ] Score values for a given input are byte-identical to scores returned by the existing `zai.htu.io/app` web UI (parity test)
- [ ] Rate limits enforced per the spec; over-limit returns structured error, not exception
- [ ] Empty `content` returns structured validation error (not exception)
- [ ] Invalid `type` returns structured validation error
- [ ] Spec content >200KB returns structured size error
- [ ] No spec content appears in any log output (server stderr is empty during normal operation)
- [ ] Vitest unit tests cover: parity with web UI, rate limit enforcement, error responses, ≥85% line coverage
- [ ] Integration test using `@modelcontextprotocol/sdk/client` confirms end-to-end protocol flow
- [ ] README documents Claude Desktop install in <10 lines
- [ ] README includes an example LLM transcript showing `score_spec` being called and the response interpreted
- [ ] PR includes a 30-second screencast (gif or mp4) showing Claude Desktop calling the tool
- [ ] All 9 ZAI FEAT rubric checks pass on the scored spec
- [ ] daniel-silvers approval recorded on PR before merge

## Game Theory Cooperative Model review

Three parties: the consultant offering the methodology (HTU), the prospective buyer evaluating it, and the LLM platform vendor (Anthropic) hosting the agent that drives the MCP tool. Cooperative equilibrium: HTU exposes the methodology programmatically, buyers can verify it without commitment, Anthropic gets a showcase MCP integration. All three parties strictly prefer "tool exists and works" over "tool doesn't exist."

Operationally enforced by:
- Stateless tool — no buyer data is captured during the demo, removing trust friction
- Open-source MCP server code (planned, license TBD; likely MIT or Apache-2.0) — buyers can audit before connecting their LLM
- Returns same structured data the public web UI already exposes — no information asymmetry between demo and production

### Who benefits

Five cooperators, each strictly better off than under the alternative ("no MCP, manual scoring only"):

1. The consultant (HTU operator) — gains a live demonstrable proof of methodology that converts buyer conversations to discovery calls faster than verbal claims alone. Time-to-revenue compresses from 60-120 days (build-everything-first) to 14-45 days (demo-now-build-as-needed).
2. The prospective buyer — can validate the methodology in their own environment using their own LLM client in 5 minutes. Reduces evaluation cost from "schedule a deep technical review" to "drop a spec into Claude Desktop."
3. The LLM vendor (Anthropic) — gains an additional production MCP integration, strengthens the MCP ecosystem story, no cost of integration to them.
4. Future paid-tier customers — when authenticated MCP tools (`file_issue`, `trigger_implw`) ship, they inherit the proven foundation; no rebuild.
5. The methodology itself — practicing what it preaches. ZiLin Methodology says spec-driven AI development; if HTU's own ZAI is driveable from AI agents via standard protocol, that's the strongest possible proof.

No party in the game has a defection that improves their payoff. The consultant gains nothing by withholding the tool; the buyer gains nothing by paying without verification; the vendor gains nothing by blocking integration.

### Abuse vector

Hostile cases considered:

1. Spammer floods `score_spec` calls to exhaust ZAI compute. Mitigation: per-IP rate limits enforced via existing ZAI infrastructure. Worst case: rate limit triggers, tool returns rate-limit response, attacker wastes their own time.
2. Adversary submits 200KB of malformed markdown to crash parser. Mitigation: input size cap, content validation, structured error response on parse failure. Parser is the same code as the web UI, already battle-tested.
3. Spec content extraction via timing side-channels. Mitigation: scoring is constant-time per check (rubric is structural pattern matching); no input-dependent branching that would leak content shape.
4. Supply-chain attack on `@htu/zai-mcp` npm package. Mitigation: package published from a CI workflow with signed tags; daniel-silvers approval required for releases; lockfile committed; minimal dependencies (only `@modelcontextprotocol/sdk` and the existing ZAI rubric module from the zai repo).
5. LLM agent uses the MCP tool to draft adversarial specs that pass ZAI but encode intent harmful to the operator's downstream systems. Mitigation: out of scope — `score_spec` only scores; it does not file issues or trigger pipelines. Downstream defense (auth + ZiLin-Dev validation) belongs to other FEATs.
6. Rate-limit evasion via VPN/proxy rotation. Mitigation: bounded by per-day caps; high friction relative to value extracted (free score-only access is also publicly available via the web UI).

The dominant strategy under all considered adversaries is for HTU to maintain stateless+rate-limited semantics; deviation provides no operator benefit and inflates breach surface.

## Subject Migration Summary

| Subject | From | To | Notes |
|---|---|---|---|
| ZAI scoring access surface | web UI only (`zai.htu.io/app`) + REST API (`POST /api/v1/validate`) | web UI + REST API + MCP stdio server | Additive, non-breaking |
| MCP integration on the htu portfolio | none | `@htu/zai-mcp` published to npm | First MCP integration in the portfolio |
| ZiLin Methodology demonstration | web UI screenshot during sales calls | live invocation from the buyer's own LLM client | Demonstrably real, not a brochure |
| Buyer evaluation friction | "schedule a technical review" | "drop a spec into your Claude Desktop, see the score in 2 seconds" | Reduces evaluation activation energy |
| Open questions | — | — | Should the MCP server expose `bundles` parameter or auto-detect from spec content? Should there be a `version` tool that reports rubric version separately from each call? Should the npm package be public or scoped private to invited buyers initially? Resolve at implementation time or first buyer feedback. |

## Files created / updated

```
zai/                                                                 [existing repo]
├── packages/
│   └── zai-mcp/                                                    [new package]
│       ├── package.json                                            [new]
│       ├── tsconfig.json                                           [new]
│       ├── src/
│       │   ├── index.ts                                            [new] MCP server entry, stdio transport setup
│       │   ├── tools/
│       │   │   └── score-spec.ts                                   [new] tool definition + handler
│       │   ├── rate-limit.ts                                       [new] per-IP rate limiter, in-memory
│       │   └── score-engine.ts                                     [new] re-export of existing ZAI rubric scoring
│       ├── tests/
│       │   ├── unit/
│       │   │   ├── score-spec.test.ts                              [new]
│       │   │   ├── rate-limit.test.ts                              [new]
│       │   │   └── parity-with-web-ui.test.ts                      [new] critical: same input → same output as web
│       │   └── integration/
│       │       └── mcp-protocol.test.ts                            [new] uses @modelcontextprotocol/sdk/client
│       ├── README.md                                               [new] install + Claude Desktop config + transcript
│       └── DEMO.md                                                 [new] sample transcripts for screencast capture
├── src/scoring/                                                    [existing path, may differ]
│   └── (existing files re-exported by score-engine.ts)             [no edits]
├── package.json                                                    [edit] add workspaces or lerna config if not present
├── pnpm-workspace.yaml or similar                                  [edit if monorepo tooling present]
└── .github/workflows/
    └── publish-mcp.yml                                             [new] CI workflow to publish on tag, requires daniel-silvers approval gate
```

## Models Applied

The following models from the canonical 16-model catalog were applied; structural evidence noted for ZAI Pass B detection:

- #1 Game Theory Cooperative — see `## Game Theory Cooperative Model review` (three-party game), `### Who benefits` (five cooperators), `### Abuse vector` (six adversary cases)
- #2 Decision Tree — see `## Decision Tree` table with Options/Chosen/Why + `### Trigger for change`
- #3 Draft-of-thoughts — see `## Draft-of-thoughts` section
- #5 Flywheel — friction reduction in buyer evaluation: longer demos → shorter demos → instant verification → faster discovery calls → faster contracts
- #11 Progressive Disclosure — single tool now, additional tools (file_issue, trigger_implw) deferred to subsequent FEATs based on buyer demand signals
- #15 Inversion / Premortem — see `### Abuse vector` and `## Draft-of-thoughts` (the "what makes this fail" reasoning)
- #16 Mechanism Design — anonymous + stateless + rate-limited makes defection structurally impossible to extract value from; cooperators retain full benefit

## Legal triggers

Trigger #4 — open source license declaration. The package will be published to npm; license must be declared. Recommend MIT or Apache-2.0 to maximize adoption (MCP ecosystem norm). Final license choice deferred to PR review; counsel touch unnecessary for permissive open-source licensing of a tool that wraps the operator's own scoring engine.

Trigger #7 — npm package naming. The `@htu` scope must be available on npm or registered before publish. Verify availability before merge; if `@htu` is taken, fall back to `@htu-io` or `@hightechunited`. No legal risk in any of these names — none collides with known trademarks for similar developer tools.

No PII, no third-party data, no contract clauses, no royalty obligations, no liability exposure beyond standard "as-is" disclaimer required by the npm license.

## Run locally (optional)

```bash
# WSL
cp /mnt/c/Users/zilin/Downloads/2026-04-28__feat__zai-mcp-demo-score-spec-v1.scored.md \
   ~/dev/zai/issues/2026-04-28__feat__zai-mcp-demo-score-spec.md

cd ~/dev/zai
git fetch origin && git checkout $(gh repo view --json defaultBranchRef -q .defaultBranchRef.name) && git pull --ff-only

# Verify required labels exist on zai (file label-prep micro-chore if missing, per the htu.io
# governance rule that requires repo-state changes go through specs)
gh label list --repo zi007lin/zai --json name -q '.[].name' | grep -ixE 'feat|mcp|demo'

gh issue create \
  --repo zi007lin/zai \
  --title "feat: ZAI MCP server (demo subset, score_spec only)" \
  --body-file issues/2026-04-28__feat__zai-mcp-demo-score-spec.md \
  --label feat

# Note the issue number, then:
implw <number>
```

After merge, install in Claude Desktop and verify in <5 minutes. The demo is then live.

---

## ZAI Spec Score

- **Rubric version:** 1.3.1
- **Spec type:** feat
- **Evaluated at:** 2026-04-29T05:20:14.306Z
- **Score:** 9/9
- **Passed:** YES

| Section | Status |
|---|---|
| intent | PASS |
| decision_tree | PASS |
| final_spec | PASS |
| acceptance_criteria | PASS |
| game_theory | PASS |
| migration_summary | PASS |
| files_list | PASS |
| models_applied | PASS |
| legal_triggers | PASS |

_Source: 2026-04-28__feat__zai-mcp-demo-score-spec-v1.md_
