import { describe, it, expect, beforeEach } from "vitest";
import { handleScoreSpec } from "../../src/tools/score-spec.js";
import { scoreSpec } from "../../src/score-engine.js";
import { _resetRateLimits } from "../../src/rate-limit.js";

// Parity test: scores returned by the MCP tool match scoreSpec directly
// (the function the web UI calls). Same input -> same passed bool, same
// section pass/fail set, same rubric_version, same total counts.

const FIXTURES: Array<{ name: string; type: string; markdown: string }> = [
  {
    name: "minimal feat",
    type: "feat",
    markdown: `# feat: minimal

**Repo:** \`zi007lin/zai\`

## Intent
short.

## Decision Tree
| Q | Options | Chosen | Why |
|---|---|---|---|
| 1 | a / b | a | because |

## Final Spec
body

## Acceptance Criteria
- [ ] one

## Game Theory Cooperative Model review
cooperators win.

## Subject Migration Summary
| Topic | State |
|---|---|
| a | b |

## Files created / updated
\`\`\`
x.ts (new)
\`\`\`

## Models Applied
- #1 Game Theory Cooperative — applied

## Legal triggers
None.
`,
  },
  {
    name: "chore (smaller rubric)",
    type: "chore",
    markdown: `# chore: bump

**Repo:** \`zi007lin/zai\`

## Intent
bump dep.

## Action
edit package.json.

## Acceptance Criteria
- [ ] tests pass

## Files
\`\`\`
package.json (edit)
\`\`\`

## Legal triggers
None.
`,
  },
];

describe("parity with web UI scoring engine", () => {
  beforeEach(() => _resetRateLimits());

  for (const fx of FIXTURES) {
    it(`matches scoreSpec direct call for ${fx.name}`, () => {
      const synthFilename = `2026-01-01__${fx.type}__parity.md`;
      const direct = scoreSpec(fx.markdown, synthFilename);
      const viaTool = handleScoreSpec(
        { content: fx.markdown, type: fx.type },
        `parity-${fx.name}`
      );
      expect("error" in viaTool).toBe(false);
      if ("error" in viaTool) return;

      expect(viaTool.passed).toBe(direct.passed);
      expect(viaTool.rubric_version).toBe(direct.rubric_version);
      expect(viaTool.type).toBe(direct.spec_type);
      expect(viaTool.max).toBe(direct.required_count);

      // Per-section parity: each MCP "check" maps to a section in the
      // direct result. Pass/fail status must agree.
      const directPassMap = Object.fromEntries(
        direct.section_order.map((k) => [
          direct.section_labels[k] ?? k,
          direct.sections[k] === "PASS" || direct.sections[k] === "SKIP",
        ])
      );
      for (const c of viaTool.checks) {
        expect(directPassMap[c.name]).toBe(c.pass);
      }
    });
  }
});
