import { describe, it, expect } from "vitest";
import { scoreSpec, detectSpecType } from "./scoreSpec";

// ─── feat fixture ─────────────────────────────────────────────────────────

const featSpec = `# title

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

// ─── research fixture ─────────────────────────────────────────────────────

const researchSpec = `# research title

## Intent
Audit the thing to answer the open questions.

## Research Questions

### Q1 — one
Details.

### Q2 — two
Details.

## Acceptance Criteria
- [ ] answered Q1
- [ ] answered Q2
- [ ] report saved to issues/reports/example.md

## Report Format
The report structure is documented here.

## Subject Migration Summary
| | |
|---|---|
| Open questions | list here |

## Files
\`\`\`
issues/reports/example.md
\`\`\`
`;

// ─── bug fixture ──────────────────────────────────────────────────────────

const bugSpec = `# bug title

## Intent
Fix the thing that breaks.

## Repro
Steps to reproduce.

## Fix
Details.

## Acceptance Criteria
- [ ] one
- [ ] two

## Subject Migration Summary
| | |
|---|---|
| Open questions | confirm regression |

## Files
\`\`\`
src/foo.ts
\`\`\`
`;

// ─── chore fixture ────────────────────────────────────────────────────────

const choreSpec = `# chore title

## Intent
Bump dep.

## Files
\`\`\`
package.json
\`\`\`
`;

// ─── hotfix fixture ───────────────────────────────────────────────────────

const hotfixSpec = `# hotfix title

## Intent
Urgent prod fix.

## Fix
Patch.

## Acceptance Criteria
- [ ] prod green
- [ ] incident closed

## Files
\`\`\`
src/foo.ts
\`\`\`
`;

// ─── detectSpecType ───────────────────────────────────────────────────────

describe("detectSpecType", () => {
  it("extracts feat from filename prefix", () => {
    expect(detectSpecType("2026-04-13__feat__title.md")).toBe("feat");
  });
  it("extracts research, bug, chore, hotfix", () => {
    expect(detectSpecType("2026-04-13__research__x.md")).toBe("research");
    expect(detectSpecType("2026-04-13__bug__x.md")).toBe("bug");
    expect(detectSpecType("2026-04-13__chore__x.md")).toBe("chore");
    expect(detectSpecType("2026-04-13__hotfix__x.md")).toBe("hotfix");
  });
  it("normalizes feature → feat and refactor → chore", () => {
    expect(detectSpecType("2026-04-13__feature__x.md")).toBe("feat");
    expect(detectSpecType("2026-04-13__refactor__x.md")).toBe("chore");
  });
  it("defaults unknown or missing type to feat", () => {
    expect(detectSpecType("2026-04-13__wat__x.md")).toBe("feat");
    expect(detectSpecType("random.md")).toBe("feat");
    expect(detectSpecType("")).toBe("feat");
  });
  it("strips directory components from the path", () => {
    expect(detectSpecType("issues/2026-04-13__research__x.md")).toBe("research");
    expect(detectSpecType("/abs/path/2026-04-13__bug__x.md")).toBe("bug");
  });
});

// ─── scoreSpec — feat ─────────────────────────────────────────────────────

describe("scoreSpec — feat", () => {
  it("scores a compliant feat spec 7/7 passed", () => {
    const r = scoreSpec(featSpec, "2026-04-12__feat__example.md");
    expect(r.spec_type).toBe("feat");
    expect(r.required_count).toBe(7);
    expect(r.score).toBe("7/7");
    expect(r.passed).toBe(true);
    expect(r.sections.draft_of_thoughts).toBe("PASS");
    // all passing sections have null reason
    for (const key of r.section_order) {
      if (r.sections[key] !== "FAIL") {
        expect(r.section_reasons[key]).toBeNull();
      }
    }
  });

  it("intent FAILs on empty body with reason", () => {
    const md = featSpec.replace(
      /## Intent\nA tight paragraph[^\n]*\n/,
      "## Intent\n\n"
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toBe("intent section is empty");
  });

  it("intent FAILs when body exceeds 150 words with reason", () => {
    const long = "word ".repeat(200);
    const md = `## Intent\n${long}\n\n## Next\n`;
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/exceeds 150-word limit/);
  });

  it("decision_tree FAILs without a table", () => {
    const md = featSpec.replace(
      /\| Option \| Risk \| Decision \|\n\|---\|---\|---\|\n\| A \| low \| ✅ \|\n/,
      ""
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.decision_tree).toBe("FAIL");
    expect(r.section_reasons.decision_tree).toMatch(/missing decision table/);
  });

  it("draft_of_thoughts SKIPs when absent (never FAIL)", () => {
    const md = featSpec.replace(/## Draft-of-thoughts[\s\S]*?(?=## )/, "");
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.draft_of_thoughts).toBe("SKIP");
    expect(r.section_reasons.draft_of_thoughts).toBeNull();
    expect(r.passed).toBe(true);
    expect(r.score).toBe("7/7");
  });

  it("final_spec FAILs with fewer than 3 acceptance checkboxes", () => {
    const md = featSpec.replace(
      /- \[ \] one\n- \[ \] two\n- \[ \] three\n/,
      "- [ ] one\n- [ ] two\n"
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.final_spec).toBe("FAIL");
    expect(r.section_reasons.final_spec).toMatch(/minimum 3 acceptance criteria/);
  });

  it("game_theory FAILs when Mitigation is missing", () => {
    const md = featSpec.replace(/Mitigation:[^\n]*\n/, "");
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.game_theory).toBe("FAIL");
    expect(r.section_reasons.game_theory).toMatch(/Mitigation/);
  });
});

// ─── scoreSpec — research ─────────────────────────────────────────────────

describe("scoreSpec — research", () => {
  it("scores a compliant research spec 6/6 passed", () => {
    const r = scoreSpec(researchSpec, "2026-04-13__research__example.md");
    expect(r.spec_type).toBe("research");
    expect(r.required_count).toBe(6);
    expect(r.score).toBe("6/6");
    expect(r.passed).toBe(true);
    expect(r.sections.research_questions).toBe("PASS");
    expect(r.sections.report_format).toBe("PASS");
    expect("decision_tree" in r.sections).toBe(false);
    expect("game_theory" in r.sections).toBe(false);
  });

  it("research_questions FAILs without at least one subheading", () => {
    const md = researchSpec.replace(/### Q1[\s\S]*?### Q2[^\n]*\n/, "");
    const r = scoreSpec(md, "2026-04-13__research__x.md");
    expect(r.sections.research_questions).toBe("FAIL");
  });

  it("acceptance_criteria FAILs without 'report saved' phrase", () => {
    const md = researchSpec.replace(
      /- \[ \] report saved[^\n]*\n/,
      "- [ ] something else\n"
    );
    const r = scoreSpec(md, "2026-04-13__research__x.md");
    expect(r.sections.acceptance_criteria).toBe("FAIL");
  });

  it("report_format FAILs when heading absent", () => {
    const md = researchSpec.replace(/## Report Format\n[\s\S]*?(?=## )/, "");
    const r = scoreSpec(md, "2026-04-13__research__x.md");
    expect(r.sections.report_format).toBe("FAIL");
  });
});

// ─── scoreSpec — bug ──────────────────────────────────────────────────────

describe("scoreSpec — bug", () => {
  it("scores a compliant bug spec 5/5 passed", () => {
    const r = scoreSpec(bugSpec, "2026-04-13__bug__example.md");
    expect(r.spec_type).toBe("bug");
    expect(r.required_count).toBe(5);
    expect(r.score).toBe("5/5");
    expect(r.passed).toBe(true);
  });

  it("fix section FAILs with fewer than 2 acceptance checkboxes", () => {
    const md = bugSpec.replace(/- \[ \] one\n- \[ \] two\n/, "- [ ] one\n");
    expect(scoreSpec(md, "2026-04-13__bug__x.md").sections.fix).toBe("FAIL");
  });

  it("reproduction_steps FAILs without ## Repro heading", () => {
    const md = bugSpec.replace(/## Repro[\s\S]*?(?=## )/, "");
    expect(scoreSpec(md, "2026-04-13__bug__x.md").sections.reproduction_steps).toBe(
      "FAIL"
    );
  });
});

// ─── scoreSpec — chore ────────────────────────────────────────────────────

describe("scoreSpec — chore", () => {
  it("scores a compliant chore spec 2/2 passed", () => {
    const r = scoreSpec(choreSpec, "2026-04-13__chore__example.md");
    expect(r.spec_type).toBe("chore");
    expect(r.required_count).toBe(2);
    expect(r.score).toBe("2/2");
    expect(r.passed).toBe(true);
    expect("decision_tree" in r.sections).toBe(false);
  });

  it("refactor alias routes to chore", () => {
    const r = scoreSpec(choreSpec, "2026-04-13__refactor__example.md");
    expect(r.spec_type).toBe("chore");
    expect(r.score).toBe("2/2");
  });
});

// ─── scoreSpec — hotfix ───────────────────────────────────────────────────

describe("scoreSpec — hotfix", () => {
  it("scores a compliant hotfix spec 3/3 passed", () => {
    const r = scoreSpec(hotfixSpec, "2026-04-13__hotfix__example.md");
    expect(r.spec_type).toBe("hotfix");
    expect(r.required_count).toBe(3);
    expect(r.score).toBe("3/3");
    expect(r.passed).toBe(true);
  });
});

// ─── section_reasons ──────────────────────────────────────────────────────

describe("scoreSpec — section_reasons", () => {
  it("all passing sections return null reasons", () => {
    const r = scoreSpec(featSpec, "2026-04-12__feat__example.md");
    for (const key of r.section_order) {
      expect(r.section_reasons[key]).toBeNull();
    }
  });

  it("failing sections return non-null reason strings", () => {
    const r = scoreSpec("# README\n\nJust a readme.\n", "2026-04-13__feat__x.md");
    for (const key of r.section_order) {
      if (r.sections[key] === "FAIL") {
        expect(typeof r.section_reasons[key]).toBe("string");
        expect((r.section_reasons[key] as string).length).toBeGreaterThan(0);
      }
    }
  });

  it("files_list reason mentions code block when section exists but has no code block", () => {
    const md = `${featSpec.replace(/```\nsrc\/foo\.ts\n```/, "no code block here")}`;
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.files_list).toBe("FAIL");
    expect(r.section_reasons.files_list).toMatch(/no code block/);
  });

  it("migration_summary reason mentions Open questions when row is empty", () => {
    const md = featSpec.replace(
      /\| Open questions \| confirm name \|/,
      "| Open questions | |"
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.migration_summary).toBe("FAIL");
    expect(r.section_reasons.migration_summary).toMatch(/Open questions/);
  });
});

// ─── gates + meta ─────────────────────────────────────────────────────────

describe("scoreSpec — gates and meta", () => {
  it("extracts multiple Pre-deploy gates from checkboxes", () => {
    const md = `${featSpec}\n- [ ] **Pre-deploy gate:** confirm chain status\n- [ ] **Pre-deploy gate** accent color confirmed`;
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.gates.length).toBe(2);
    expect(r.gates[0]).toMatch(/chain/i);
  });

  it("rubric version is 1.1.0", () => {
    expect(scoreSpec(featSpec, "2026-04-13__feat__x.md").rubric_version).toBe("1.1.0");
  });

  it("non-spec markdown falls back to feat and fails gracefully", () => {
    const r = scoreSpec("# README\n\nJust a readme.\n", "README.md");
    expect(r.spec_type).toBe("feat");
    expect(r.required_count).toBe(7);
    expect(r.passed).toBe(false);
  });
});
