import { describe, it, expect, beforeEach } from "vitest";
import { handleScoreSpec, SCORE_SPEC_TOOL } from "../../src/tools/score-spec.js";
import { _resetRateLimits } from "../../src/rate-limit.js";

const MINIMAL_FEAT = `# feat: example

**Repo:** \`zi007lin/zai\`

## Intent

A short paragraph describing the feature.

## Decision Tree

| Q | Options | Chosen | Why |
|---|---|---|---|
| 1 | a / b | a | because |

## Final Spec

Body.

## Acceptance Criteria

- [ ] item one
- [ ] item two

## Game Theory Cooperative Model review

Cooperators benefit. Adversary cases mitigated.

## Subject Migration Summary

| Topic | State |
|---|---|
| x | y |

## Files created / updated

\`\`\`
file.ts (new)
\`\`\`

## Models Applied

- #1 Game Theory Cooperative — applied
- #2 Decision Tree — applied

## Legal triggers

None.
`;

describe("handleScoreSpec — input validation", () => {
  beforeEach(() => _resetRateLimits());

  it("rejects empty content", () => {
    const r = handleScoreSpec({ content: "", type: "feat" }, "test-empty");
    expect("error" in r && r.error === "invalid_input").toBe(true);
  });

  it("rejects non-string content", () => {
    const r = handleScoreSpec({ content: 12345, type: "feat" }, "test-non-str");
    expect("error" in r && r.error === "invalid_input").toBe(true);
  });

  it("rejects unknown spec type", () => {
    const r = handleScoreSpec({ content: "x", type: "wat" }, "test-bad-type");
    expect("error" in r && r.error === "invalid_input").toBe(true);
  });

  it("rejects content >200KB", () => {
    const big = "a".repeat(200 * 1024 + 1);
    const r = handleScoreSpec({ content: big, type: "feat" }, "test-big");
    expect("error" in r && r.error === "content_too_large").toBe(true);
  });

  it("returns structured score for a minimal feat spec", () => {
    const r = handleScoreSpec({ content: MINIMAL_FEAT, type: "feat" }, "test-feat");
    expect("error" in r).toBe(false);
    if ("error" in r) return;
    expect(r.type).toBe("feat");
    expect(r.max).toBeGreaterThan(0);
    expect(Array.isArray(r.checks)).toBe(true);
    expect(r.checks.length).toBe(r.max);
    expect(typeof r.passed).toBe("boolean");
    expect(typeof r.rubric_version).toBe("string");
  });

  it("returns rate_limited error after exceeding minute cap", () => {
    const key = "test-rl";
    for (let i = 0; i < 30; i++) {
      handleScoreSpec({ content: MINIMAL_FEAT, type: "feat" }, key);
    }
    const blocked = handleScoreSpec({ content: MINIMAL_FEAT, type: "feat" }, key);
    expect("error" in blocked && blocked.error === "rate_limited").toBe(true);
  });
});

describe("SCORE_SPEC_TOOL schema", () => {
  it("declares content + type as required", () => {
    expect(SCORE_SPEC_TOOL.inputSchema.required).toContain("content");
    expect(SCORE_SPEC_TOOL.inputSchema.required).toContain("type");
  });

  it("type enum includes the canonical spec types", () => {
    const e = (SCORE_SPEC_TOOL.inputSchema.properties.type as { enum: string[] }).enum;
    expect(e).toContain("feat");
    expect(e).toContain("bug");
    expect(e).toContain("hotfix");
    expect(e).toContain("chore");
  });
});
