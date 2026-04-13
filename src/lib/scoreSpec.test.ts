import { describe, it, expect } from "vitest";
import { scoreSpec } from "./scoreSpec";

const fullSpec = `# title

## Intent
A tight paragraph describing the goal. About twenty words should be plenty.

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| A | low | ✅ |

Trigger for change: when condition X flips.

## Draft-of-thoughts
Reasoning notes live here.

## Final Spec
Details.

## Acceptance Criteria
- [ ] one
- [ ] two
- [ ] three

## Game Theory Review
Who benefits: users.
Abuse vector: gaming the system.
Mitigation: rate limits.

## Subject Migration Summary
| | |
|---|---|
| What | A thing |
| Open questions | confirm name |

## Files
\`\`\`
src/foo.ts
\`\`\`
`;

describe("scoreSpec", () => {
  it("scores a fully compliant spec 7/7 passed", () => {
    const r = scoreSpec(fullSpec);
    expect(r.passed).toBe(true);
    expect(r.score).toBe("7/7");
    expect(r.sections.intent).toBe("PASS");
    expect(r.sections.decision_tree).toBe("PASS");
    expect(r.sections.draft_of_thoughts).toBe("PASS");
    expect(r.sections.final_spec).toBe("PASS");
    expect(r.sections.game_theory).toBe("PASS");
    expect(r.sections.migration_summary).toBe("PASS");
    expect(r.sections.files_list).toBe("PASS");
    expect(r.rubric_version).toBe("1.0.0");
  });

  it("intent FAILs when body is empty", () => {
    const md = fullSpec.replace(
      /## Intent\nA tight paragraph[^\n]*\n/,
      "## Intent\n\n"
    );
    expect(scoreSpec(md).sections.intent).toBe("FAIL");
  });

  it("intent FAILs when body exceeds 150 words", () => {
    const long = "word ".repeat(200);
    const md = `## Intent\n${long}\n\n## Next\n`;
    expect(scoreSpec(md).sections.intent).toBe("FAIL");
  });

  it("decision_tree FAILs without a table", () => {
    const md = fullSpec.replace(
      /\| Option \| Risk \| Decision \|\n\|---\|---\|---\|\n\| A \| low \| ✅ \|\n/,
      ""
    );
    expect(scoreSpec(md).sections.decision_tree).toBe("FAIL");
  });

  it("decision_tree FAILs without 'Trigger for change'", () => {
    const md = fullSpec.replace(/Trigger for change[^\n]*\n/, "");
    expect(scoreSpec(md).sections.decision_tree).toBe("FAIL");
  });

  it("draft_of_thoughts SKIPs when heading absent (never FAIL)", () => {
    const md = fullSpec.replace(/## Draft-of-thoughts[\s\S]*?(?=## )/, "");
    const r = scoreSpec(md);
    expect(r.sections.draft_of_thoughts).toBe("SKIP");
    expect(r.passed).toBe(true);
  });

  it("final_spec FAILs when acceptance criteria has fewer than 3 checkboxes", () => {
    const md = fullSpec.replace(
      /## Acceptance Criteria\n- \[ \] one\n- \[ \] two\n- \[ \] three\n/,
      "## Acceptance Criteria\n- [ ] one\n- [ ] two\n"
    );
    expect(scoreSpec(md).sections.final_spec).toBe("FAIL");
  });

  it("game_theory FAILs when any required phrase missing", () => {
    const md = fullSpec.replace(/Mitigation:[^\n]*\n/, "");
    expect(scoreSpec(md).sections.game_theory).toBe("FAIL");
  });

  it("migration_summary FAILs when Open questions value is empty", () => {
    const md = fullSpec.replace(
      /\| Open questions \| confirm name \|/,
      "| Open questions |  |"
    );
    expect(scoreSpec(md).sections.migration_summary).toBe("FAIL");
  });

  it("files_list FAILs without a fenced code block", () => {
    const md = fullSpec.replace(/## Files[\s\S]*$/, "## Files\nsrc/foo.ts\n");
    expect(scoreSpec(md).sections.files_list).toBe("FAIL");
  });

  it("extracts Pre-deploy gates from checkboxes", () => {
    const md = `${fullSpec}\n- [ ] **Pre-deploy gate:** confirm chain status\n- [ ] **Pre-deploy gate** accent color confirmed`;
    const r = scoreSpec(md);
    expect(r.gates.length).toBe(2);
    expect(r.gates[0]).toMatch(/chain/i);
  });

  it("score string reflects PASS + SKIP count (never penalizes SKIP)", () => {
    const md = fullSpec.replace(/## Draft-of-thoughts[\s\S]*?(?=## )/, "");
    expect(scoreSpec(md).score).toBe("7/7");
  });

  it("non-spec markdown scores near zero without crashing", () => {
    const r = scoreSpec("# README\n\nJust a readme, no sections.\n");
    expect(r.passed).toBe(false);
    expect(r.sections.intent).toBe("FAIL");
    expect(r.sections.decision_tree).toBe("FAIL");
  });
});
