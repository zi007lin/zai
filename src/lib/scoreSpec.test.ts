import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  scoreSpec,
  detectSpecType,
  SpecTypeError,
  RUBRIC_SECTION_KEYS,
  KNOWN_TYPES,
  INTENT_CAPS,
} from "./scoreSpec";
import type { SpecType } from "./scoreSpec";

// ─── feat fixture (9 checks, v1.2) ────────────────────────────────────────

const featSpec = `# title

## Intent
A tight paragraph describing the goal. About twenty words should be plenty.

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| A | low | ✅ |

Trigger for change: when condition X flips.

## Final Spec
Details of the final design.

## Acceptance Criteria
- [ ] one
- [ ] two
- [ ] three

## Game Theory Cooperative Model review
Who benefits: users.
Abuse vector: gaming the system.
Mitigation: rate limits.

## Subject Migration Summary
| | |
|---|---|
| What | A thing |
| Open questions | confirm name |

## Files created / updated
\`\`\`
src/foo.ts
\`\`\`

## Models Applied
- #1 Game Theory Cooperative
- #2 Decision Tree
- #14 SIX PASS Validation

## Legal triggers
None.
`;

// ─── research fixture (6 checks, v1.2 unchanged) ──────────────────────────

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

// ─── bug fixture (7 checks, v1.2) ─────────────────────────────────────────

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

## Legal triggers
None.
`;

// ─── hotfix fixture (7 checks — aliased to bug in v1.2) ───────────────────

const hotfixSpec = `# hotfix title

## Intent
Urgent prod fix.

## Repro
Production alert at 03:00 UTC.

## Fix
Patch.

## Acceptance Criteria
- [ ] prod green
- [ ] incident closed

## Subject Migration Summary
| | |
|---|---|
| Open questions | post-mortem in 48h |

## Files
\`\`\`
src/foo.ts
\`\`\`

## Legal triggers
None.
`;

// ─── chore fixture (5 checks, v1.2) ───────────────────────────────────────

const choreSpec = `# chore title

## Intent
Bump dep.

## Action
1. Update package.json
2. Run npm install
3. Commit lockfile

## Acceptance Criteria
- [ ] CI green

## Files
\`\`\`
package.json
\`\`\`

## Legal triggers
None.
`;

// ─── spec fixture (6 checks, v1.2) ────────────────────────────────────────

const specSpec = `# spec title

## Intent
Canonical rules for the widget domain.

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| A | low | ✅ |

Trigger for change: policy audit.

## Rules
Widget rules live here.

## Subject Migration Summary
| | |
|---|---|
| Open questions | enforcement cadence |

## Files
\`\`\`
docs/widget-rules.md
\`\`\`

## Legal triggers
None.
`;

// ─── refactor fixture (9 checks, v1.2) ────────────────────────────────────

const refactorSpec = `# refactor title

## Intent
Rename the thing to the new brand.

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| keep | high | ❌ |
| rename | low | ✅ |

Trigger for change: TM collision risk.

## Final Spec
Full rename table.

## Acceptance Criteria
- [ ] old name gone
- [ ] new name live
- [ ] redirect in place

## Subject Migration Summary
| | |
|---|---|
| What | Rename |
| Open questions | banner copy final |

## Files created / updated
\`\`\`
docs/brand/rationale.md
\`\`\`

## Models Applied
- #2 Decision Tree
- #8 Swiss Cheese

## Migration Plan
Phase 0 prep → Phase 1 dual-run → Phase 2 cutover.

### Rollback
Trigger: TM opposition. Reverse DNS, revert docs.

## Legal triggers
None.
`;

// ─── ux fixture (6 checks, v1.2) ──────────────────────────────────────────

const uxSpec = `# ux title

## Intent
Redesign the settings panel.

## Jobs To Be Done
- Find a setting quickly
- Understand what a setting does
- Undo a change safely

## Design Rationale
Rationale for the palette choice.

### Interaction of Color
Contrast pairs and palette system documented.

## Acceptance Criteria
- [ ] contrast AA
- [ ] keyboard navigable

## Assets
\`\`\`
assets/settings-panel.fig
\`\`\`

## Legal triggers
None.
`;

// ─── brand fixture (6 checks, v1.2 — same as ux) ──────────────────────────

const brandSpec = uxSpec;

// ─── Work Estimate fixture block (v1.4.0) ─────────────────────────────────
//
// Canonical Work Estimate section that satisfies the v1.4.0 detector.
// Append it to a v1.2 fixture to produce a v1.4.0-compliant fixture.

const WORK_ESTIMATE_OK = `
## Work Estimate

### Active operator time

| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | discovery |
| Phase B | 30 min | implementation |
| **Total active** | **35 min** | |

### Wall-clock time

| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 30 min - 12 hr | reviewer pace |
| **Total wall-clock** | **30 min - 12 hr** | |

### Assumptions

- repo accessible
- reviewer available

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| Phase B | 30 min | TBD | TBD | |
| **Total** | **35 min** | **TBD** | **TBD** | |
`;

const featSpec140 = featSpec + WORK_ESTIMATE_OK;
const researchSpec140 = researchSpec + WORK_ESTIMATE_OK;
const bugSpec140 = bugSpec + WORK_ESTIMATE_OK;
const hotfixSpec140 = hotfixSpec + WORK_ESTIMATE_OK;
const choreSpec140 = choreSpec + WORK_ESTIMATE_OK;
const specSpec140 = specSpec + WORK_ESTIMATE_OK;
const refactorSpec140 = refactorSpec + WORK_ESTIMATE_OK;
const uxSpec140 = uxSpec + WORK_ESTIMATE_OK;
const brandSpec140 = brandSpec + WORK_ESTIMATE_OK;

// ─── detectSpecType ───────────────────────────────────────────────────────

describe("detectSpecType", () => {
  it("extracts known types from filename prefix", () => {
    expect(detectSpecType("2026-04-13__feat__title.md")).toBe("feat");
    expect(detectSpecType("2026-04-13__research__x.md")).toBe("research");
    expect(detectSpecType("2026-04-13__bug__x.md")).toBe("bug");
    expect(detectSpecType("2026-04-13__chore__x.md")).toBe("chore");
    expect(detectSpecType("2026-04-13__hotfix__x.md")).toBe("hotfix");
    expect(detectSpecType("2026-04-13__spec__x.md")).toBe("spec");
    expect(detectSpecType("2026-04-13__refactor__x.md")).toBe("refactor");
    expect(detectSpecType("2026-04-13__ux__x.md")).toBe("ux");
    expect(detectSpecType("2026-04-13__brand__x.md")).toBe("brand");
  });

  it("normalizes feature → feat (documented alias)", () => {
    expect(detectSpecType("2026-04-13__feature__x.md")).toBe("feat");
  });

  it("refactor is NOT aliased to chore anymore (the bug this PR fixes)", () => {
    expect(detectSpecType("2026-04-13__refactor__x.md")).toBe("refactor");
  });

  it("throws SpecTypeError on unknown type", () => {
    expect(() => detectSpecType("2026-04-13__wat__x.md")).toThrow(SpecTypeError);
    expect(() => detectSpecType("2026-04-13__wat__x.md")).toThrow(/Unknown spec type/);
  });

  it("throws SpecTypeError on missing prefix", () => {
    expect(() => detectSpecType("random.md")).toThrow(SpecTypeError);
    expect(() => detectSpecType("")).toThrow(SpecTypeError);
    expect(() => detectSpecType("README.md")).toThrow(SpecTypeError);
  });

  it("strips directory components from the path", () => {
    expect(detectSpecType("issues/2026-04-13__research__x.md")).toBe("research");
    expect(detectSpecType("/abs/path/2026-04-13__bug__x.md")).toBe("bug");
  });
});

// ─── scoreSpec — feat (9 checks) ──────────────────────────────────────────

describe("scoreSpec — feat", () => {
  it("scores a compliant feat spec 10/10 passed (v1.4.0)", () => {
    const r = scoreSpec(featSpec140, "2026-04-12__feat__example.md");
    expect(r.spec_type).toBe("feat");
    expect(r.required_count).toBe(10);
    expect(r.score).toBe("10/10");
    expect(r.passed).toBe(true);
    for (const key of r.section_order) {
      if (r.sections[key] !== "FAIL") {
        expect(r.section_reasons[key]).toBeNull();
      }
    }
  });

  it("intent FAILs on empty body with reason", () => {
    const md = featSpec.replace(
      /## Intent\nA tight paragraph[^\n]*\n/,
      "## Intent\n\n",
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toBe("intent section is empty");
  });

  it("intent FAILs when body exceeds 150 words", () => {
    const long = "word ".repeat(200);
    const md = featSpec.replace(
      /## Intent\nA tight paragraph[^\n]*/,
      `## Intent\n${long}`,
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/exceeds 150-word cap/);
    expect(r.section_reasons.intent).toMatch(/FEAT/);
  });

  it("decision_tree FAILs without a table", () => {
    const md = featSpec.replace(
      /\| Option \| Risk \| Decision \|\n\|---\|---\|---\|\n\| A \| low \| ✅ \|\n/,
      "",
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.decision_tree).toBe("FAIL");
    expect(r.section_reasons.decision_tree).toMatch(/missing decision table/);
  });

  it("acceptance_criteria FAILs with fewer than 3 checkboxes", () => {
    const md = featSpec.replace(
      /- \[ \] one\n- \[ \] two\n- \[ \] three\n/,
      "- [ ] one\n- [ ] two\n",
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.acceptance_criteria).toBe("FAIL");
    expect(r.section_reasons.acceptance_criteria).toMatch(/minimum 3/);
  });

  it("game_theory FAILs when Mitigation is missing", () => {
    const md = featSpec.replace(/Mitigation:[^\n]*\n/, "");
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.game_theory).toBe("FAIL");
    expect(r.section_reasons.game_theory).toMatch(/Mitigation/);
  });

  it("models_applied FAILs when section empty", () => {
    const md = featSpec.replace(
      /## Models Applied\n[\s\S]*?(?=\n## )/,
      "## Models Applied\n",
    );
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.models_applied).toBe("FAIL");
    expect(r.section_reasons.models_applied).toMatch(/no model declarations/);
  });

  it("legal_triggers FAILs when heading absent", () => {
    const md = featSpec.replace(/## Legal triggers\nNone\.\n/, "");
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.legal_triggers).toBe("FAIL");
    expect(r.section_reasons.legal_triggers).toMatch(/Legal triggers/);
  });
});

// ─── scoreSpec — research (6 checks, v1.2 unchanged) ──────────────────────

describe("scoreSpec — research", () => {
  it("scores a compliant research spec 7/7 passed (v1.4.0)", () => {
    const r = scoreSpec(researchSpec140, "2026-04-13__research__example.md");
    expect(r.spec_type).toBe("research");
    expect(r.required_count).toBe(7);
    expect(r.score).toBe("7/7");
    expect(r.passed).toBe(true);
  });

  it("research has no legal_triggers check (non-building exemption)", () => {
    const r = scoreSpec(researchSpec, "2026-04-13__research__example.md");
    expect("legal_triggers" in r.sections).toBe(false);
  });

  it("research_questions FAILs without at least one subheading", () => {
    const md = researchSpec.replace(/### Q1[\s\S]*?### Q2[^\n]*\n/, "");
    const r = scoreSpec(md, "2026-04-13__research__x.md");
    expect(r.sections.research_questions).toBe("FAIL");
  });

  it("acceptance_criteria FAILs without 'report saved' or 'report is complete' phrase", () => {
    const md = researchSpec.replace(
      /- \[ \] report saved[^\n]*\n/,
      "- [ ] something else\n",
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

// ─── scoreSpec — bug (7 checks, v1.2) ─────────────────────────────────────

describe("scoreSpec — bug", () => {
  it("scores a compliant bug spec 8/8 passed (v1.4.0)", () => {
    const r = scoreSpec(bugSpec140, "2026-04-13__bug__example.md");
    expect(r.spec_type).toBe("bug");
    expect(r.required_count).toBe(8);
    expect(r.score).toBe("8/8");
    expect(r.passed).toBe(true);
  });

  it("acceptance_criteria FAILs with fewer than 2 checkboxes", () => {
    const md = bugSpec.replace(/- \[ \] one\n- \[ \] two\n/, "- [ ] one\n");
    expect(scoreSpec(md, "2026-04-13__bug__x.md").sections.acceptance_criteria).toBe(
      "FAIL",
    );
  });

  it("repro FAILs without ## Repro heading", () => {
    const md = bugSpec.replace(/## Repro[\s\S]*?(?=## )/, "");
    expect(scoreSpec(md, "2026-04-13__bug__x.md").sections.repro).toBe("FAIL");
  });

  it("legal_triggers FAILs when heading absent", () => {
    const md = bugSpec.replace(/## Legal triggers\nNone\.\n/, "");
    expect(scoreSpec(md, "2026-04-13__bug__x.md").sections.legal_triggers).toBe(
      "FAIL",
    );
  });
});

// ─── scoreSpec — hotfix (7 checks — aliased to bug) ───────────────────────

describe("scoreSpec — hotfix", () => {
  it("scores a compliant hotfix spec 8/8 passed (v1.4.0)", () => {
    const r = scoreSpec(hotfixSpec140, "2026-04-13__hotfix__example.md");
    expect(r.spec_type).toBe("hotfix");
    expect(r.required_count).toBe(8);
    expect(r.score).toBe("8/8");
    expect(r.passed).toBe(true);
  });

  it("hotfix uses same section set as bug (v1.4.0)", () => {
    const r = scoreSpec(hotfixSpec140, "2026-04-13__hotfix__example.md");
    expect(r.section_order).toEqual([
      "intent",
      "repro",
      "fix",
      "acceptance_criteria",
      "migration_summary",
      "files",
      "legal_triggers",
      "work_estimate",
    ]);
  });
});

// ─── scoreSpec — chore (5 checks, v1.2) ───────────────────────────────────

describe("scoreSpec — chore", () => {
  it("scores a compliant chore spec 6/6 passed (v1.4.0)", () => {
    const r = scoreSpec(choreSpec140, "2026-04-13__chore__example.md");
    expect(r.spec_type).toBe("chore");
    expect(r.required_count).toBe(6);
    expect(r.score).toBe("6/6");
    expect(r.passed).toBe(true);
  });

  it("intent FAILs when body exceeds 100 words for chore", () => {
    const long = "word ".repeat(120);
    const md = choreSpec.replace(/## Intent\nBump dep\.\n/, `## Intent\n${long}\n`);
    const r = scoreSpec(md, "2026-04-13__chore__x.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/100-word cap/);
    expect(r.section_reasons.intent).toMatch(/CHORE/);
  });

  it("action FAILs when no numbered steps", () => {
    const md = choreSpec.replace(
      /## Action\n1\. [\s\S]*?(?=\n## )/,
      "## Action\nNo numbered steps here.\n",
    );
    const r = scoreSpec(md, "2026-04-13__chore__x.md");
    expect(r.sections.action).toBe("FAIL");
  });
});

// ─── scoreSpec — spec (6 checks, v1.2) ────────────────────────────────────

describe("scoreSpec — spec", () => {
  it("scores a compliant spec 7/7 passed (v1.4.0)", () => {
    const r = scoreSpec(specSpec140, "2026-04-13__spec__example.md");
    expect(r.spec_type).toBe("spec");
    expect(r.required_count).toBe(7);
    expect(r.score).toBe("7/7");
    expect(r.passed).toBe(true);
  });

  it("rules_or_content accepts ## Content instead of ## Rules", () => {
    const md = specSpec.replace(/## Rules\n/, "## Content\n");
    const r = scoreSpec(md, "2026-04-13__spec__x.md");
    expect(r.sections.rules_or_content).toBe("PASS");
  });

  it("rules_or_content FAILs when neither heading is present", () => {
    const md = specSpec.replace(/## Rules\nWidget rules live here\.\n\n/, "");
    const r = scoreSpec(md, "2026-04-13__spec__x.md");
    expect(r.sections.rules_or_content).toBe("FAIL");
  });
});

// ─── scoreSpec — refactor (9 checks, v1.2) ────────────────────────────────

describe("scoreSpec — refactor", () => {
  it("scores a compliant refactor spec 10/10 passed (v1.4.0)", () => {
    const r = scoreSpec(refactorSpec140, "2026-04-13__refactor__example.md");
    expect(r.spec_type).toBe("refactor");
    expect(r.required_count).toBe(10);
    expect(r.score).toBe("10/10");
    expect(r.passed).toBe(true);
  });

  it("refactor is NOT downgraded to chore (Apr 2026 bug fix); v1.4.0 has 10 checks", () => {
    const r = scoreSpec(refactorSpec140, "2026-04-13__refactor__example.md");
    expect(r.spec_type).toBe("refactor");
    expect(r.required_count).toBe(10);
  });

  it("migration_plan FAILs without ### Rollback subsection", () => {
    const md = refactorSpec.replace(/### Rollback\n[\s\S]*?(?=\n## )/, "");
    const r = scoreSpec(md, "2026-04-13__refactor__x.md");
    expect(r.sections.migration_plan).toBe("FAIL");
    expect(r.section_reasons.migration_plan).toMatch(/Rollback/);
  });

  it("refactor requires Models Applied", () => {
    const md = refactorSpec.replace(/## Models Applied\n[\s\S]*?(?=\n## )/, "");
    const r = scoreSpec(md, "2026-04-13__refactor__x.md");
    expect(r.sections.models_applied).toBe("FAIL");
  });

  it("refactor does NOT require Game Theory (unlike FEAT)", () => {
    const r = scoreSpec(refactorSpec, "2026-04-13__refactor__example.md");
    expect("game_theory" in r.sections).toBe(false);
  });
});

// ─── scoreSpec — ux / brand (6 checks each, v1.2) ─────────────────────────

describe("scoreSpec — ux", () => {
  it("scores a compliant ux spec 7/7 passed (v1.4.0)", () => {
    const r = scoreSpec(uxSpec140, "2026-04-13__ux__example.md");
    expect(r.spec_type).toBe("ux");
    expect(r.required_count).toBe(7);
    expect(r.score).toBe("7/7");
    expect(r.passed).toBe(true);
  });

  it("jobs_to_be_done FAILs with fewer than 3 jobs", () => {
    const md = uxSpec.replace(
      /## Jobs To Be Done\n[\s\S]*?(?=\n## )/,
      "## Jobs To Be Done\n- Only one job\n",
    );
    const r = scoreSpec(md, "2026-04-13__ux__x.md");
    expect(r.sections.jobs_to_be_done).toBe("FAIL");
    expect(r.section_reasons.jobs_to_be_done).toMatch(/minimum 3/);
  });

  it("jobs_to_be_done FAILs with more than 5 jobs", () => {
    const md = uxSpec.replace(
      /## Jobs To Be Done\n[\s\S]*?(?=\n## )/,
      "## Jobs To Be Done\n- a\n- b\n- c\n- d\n- e\n- f\n",
    );
    const r = scoreSpec(md, "2026-04-13__ux__x.md");
    expect(r.sections.jobs_to_be_done).toBe("FAIL");
    expect(r.section_reasons.jobs_to_be_done).toMatch(/maximum 5/);
  });

  it("design_rationale FAILs without ### Interaction of Color", () => {
    const md = uxSpec.replace(/### Interaction of Color\n[\s\S]*?(?=\n## )/, "");
    const r = scoreSpec(md, "2026-04-13__ux__x.md");
    expect(r.sections.design_rationale).toBe("FAIL");
    expect(r.section_reasons.design_rationale).toMatch(/Interaction of Color/);
  });
});

describe("scoreSpec — brand", () => {
  it("scores a compliant brand spec 7/7 passed (v1.4.0; same rubric as ux)", () => {
    const r = scoreSpec(brandSpec140, "2026-04-13__brand__example.md");
    expect(r.spec_type).toBe("brand");
    expect(r.required_count).toBe(7);
    expect(r.score).toBe("7/7");
    expect(r.passed).toBe(true);
  });
});

// ─── section_reasons ──────────────────────────────────────────────────────

describe("scoreSpec — section_reasons", () => {
  it("all passing sections return null reasons", () => {
    const r = scoreSpec(featSpec140, "2026-04-12__feat__example.md");
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
    const md = featSpec.replace(/```\nsrc\/foo\.ts\n```/, "no code block here");
    const r = scoreSpec(md, "2026-04-13__feat__x.md");
    expect(r.sections.files_list).toBe("FAIL");
    expect(r.section_reasons.files_list).toMatch(/no code block/);
  });

  it("migration_summary reason mentions Open questions when row is empty", () => {
    const md = featSpec.replace(
      /\| Open questions \| confirm name \|/,
      "| Open questions | |",
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

  it("rubric version is 1.4.0", () => {
    expect(scoreSpec(featSpec140, "2026-04-13__feat__x.md").rubric_version).toBe("1.4.0");
  });

  it("non-matching filename throws SpecTypeError (previously silently fell back to feat)", () => {
    expect(() => scoreSpec("# README\n\nJust a readme.\n", "README.md")).toThrow(
      SpecTypeError,
    );
  });
});

// ─── drift-detection (Layer 3) ────────────────────────────────────────────
//
// Reads docs/ZAI_SYSTEM_INSTRUCTIONS.md §Appendix and asserts that every
// documented type has a rubric implementation with matching check count and
// ordered section IDs. This test is the canonical defense against
// doc-vs-code drift — the same class of bug as the refactor→chore downgrade
// that this PR fixes.

const APPENDIX_COUNT_TABLE_ROW =
  /^\|\s*`(\w+)`\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|/gm;

interface AppendixEntry {
  type: string;
  count: number;
  intentCap: number;
  keys: string[];
}

function parseAppendix(doc: string): AppendixEntry[] {
  const entries: AppendixEntry[] = [];
  const appendixStart = doc.search(/^##\s+Appendix:\s+rubric-count\s+summary/mi);
  const slice = appendixStart === -1 ? doc : doc.slice(appendixStart);
  let match: RegExpExecArray | null;
  const re = new RegExp(APPENDIX_COUNT_TABLE_ROW);
  while ((match = re.exec(slice)) !== null) {
    entries.push({
      type: match[1],
      count: Number(match[2]),
      intentCap: Number(match[3]),
      keys: match[4].split(",").map((k) => k.trim()),
    });
  }
  return entries;
}

describe("drift-detection — scoreSpec vs ZAI_SYSTEM_INSTRUCTIONS.md §Appendix", () => {
  const docPath = resolve(__dirname, "../../docs/ZAI_SYSTEM_INSTRUCTIONS.md");
  const doc = readFileSync(docPath, "utf8");
  const appendix = parseAppendix(doc);

  it("parses at least 8 types from appendix", () => {
    expect(appendix.length).toBeGreaterThanOrEqual(8);
  });

  it("every documented type has a rubric implementation", () => {
    for (const entry of appendix) {
      expect(
        (KNOWN_TYPES as readonly string[]).includes(entry.type),
        `type "${entry.type}" documented in ZAI_SYSTEM_INSTRUCTIONS.md but not in KNOWN_TYPES`,
      ).toBe(true);
      expect(
        RUBRIC_SECTION_KEYS[entry.type as SpecType],
        `type "${entry.type}" documented but has no RUBRIC_SECTION_KEYS entry`,
      ).toBeDefined();
    }
  });

  it("rubric check count matches documented count for every type", () => {
    for (const entry of appendix) {
      const implCount = RUBRIC_SECTION_KEYS[entry.type as SpecType].length;
      expect(
        implCount,
        `type "${entry.type}": doc says ${entry.count} checks, impl has ${implCount}`,
      ).toBe(entry.count);
    }
  });

  it("rubric section keys match documented order for every type", () => {
    for (const entry of appendix) {
      const implKeys = RUBRIC_SECTION_KEYS[entry.type as SpecType];
      expect(
        implKeys,
        `type "${entry.type}": doc keys [${entry.keys.join(", ")}] vs impl [${implKeys.join(", ")}]`,
      ).toEqual(entry.keys);
    }
  });

  it("REFACTOR specifically has a registered rubric with 10 checks (v1.4.0)", () => {
    expect(RUBRIC_SECTION_KEYS.refactor).toBeDefined();
    expect(RUBRIC_SECTION_KEYS.refactor.length).toBe(10);
  });

  it("hotfix is not in the appendix (aliased to bug at runtime)", () => {
    const types = appendix.map((e) => e.type);
    expect(types).not.toContain("hotfix");
  });

  it("Intent cap in scoreSpec matches documented cap for every type", () => {
    for (const entry of appendix) {
      const implCap = INTENT_CAPS[entry.type as SpecType];
      expect(
        implCap,
        `type "${entry.type}": doc says Intent cap ${entry.intentCap}, impl has ${implCap}`,
      ).toBe(entry.intentCap);
    }
  });

  it("SPEC, REFACTOR, RESEARCH have documented caps above 150", () => {
    expect(INTENT_CAPS.spec).toBe(250);
    expect(INTENT_CAPS.refactor).toBe(250);
    expect(INTENT_CAPS.research).toBe(200);
  });

  it("FEAT, BUG, UX, BRAND retain 150-word Intent cap", () => {
    expect(INTENT_CAPS.feat).toBe(150);
    expect(INTENT_CAPS.bug).toBe(150);
    expect(INTENT_CAPS.ux).toBe(150);
    expect(INTENT_CAPS.brand).toBe(150);
  });

  it("CHORE retains its 100-word Intent cap", () => {
    expect(INTENT_CAPS.chore).toBe(100);
  });
});

// ─── per-type Intent cap fixtures ────────────────────────────────────────
//
// Mirrors the fixture list in issues/2026-04-20__bug__intent-token-cap-per-type-v1
// §Files. Each fixture exercises a boundary near the documented cap.

function makeWords(count: number): string {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
}

const specBase = (intentBody: string) => `# spec title

## Intent
${intentBody}

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| A | low | ✅ |

Trigger for change: policy audit.

## Rules
Widget rules live here.

## Subject Migration Summary
| | |
|---|---|
| Open questions | enforcement cadence |

## Files
\`\`\`
docs/widget-rules.md
\`\`\`

## Legal triggers
None.
${WORK_ESTIMATE_OK}`;

const refactorBase = (intentBody: string) => `# refactor title

## Intent
${intentBody}

## Decision Tree
| Option | Risk | Decision |
|---|---|---|
| keep | high | ❌ |
| rename | low | ✅ |

Trigger for change: TM collision risk.

## Final Spec
Full rename table.

## Acceptance Criteria
- [ ] old name gone
- [ ] new name live
- [ ] redirect in place

## Subject Migration Summary
| | |
|---|---|
| What | Rename |
| Open questions | banner copy final |

## Files created / updated
\`\`\`
docs/brand/rationale.md
\`\`\`

## Models Applied
- #2 Decision Tree
- #8 Swiss Cheese

## Migration Plan
Phase 0 prep → Phase 1 dual-run → Phase 2 cutover.

### Rollback
Trigger: TM opposition. Reverse DNS, revert docs.

## Legal triggers
None.
${WORK_ESTIMATE_OK}`;

const researchBase = (intentBody: string) => `# research title

## Intent
${intentBody}

## Research Questions

### Q1 — one
Details.

## Acceptance Criteria
- [ ] answered Q1
- [ ] confirmed scope
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
${WORK_ESTIMATE_OK}`;

describe("scoreSpec — per-type Intent caps", () => {
  it("spec-intent-240-pass: SPEC at 240 words passes under 250-word cap", () => {
    const r = scoreSpec(specBase(makeWords(240)), "2026-04-20__spec__fixture.md");
    expect(r.sections.intent).toBe("PASS");
    expect(r.passed).toBe(true);
  });

  it("spec-intent-260-fail: SPEC at 260 words fails under 250-word cap", () => {
    const r = scoreSpec(specBase(makeWords(260)), "2026-04-20__spec__fixture.md");
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/250-word cap/);
    expect(r.section_reasons.intent).toMatch(/SPEC/);
    expect(r.section_reasons.intent).toMatch(/decomposing|Decision Tree|Draft-of-thoughts/);
  });

  it("refactor-intent-245-pass: REFACTOR at 245 words passes under 250-word cap", () => {
    const r = scoreSpec(
      refactorBase(makeWords(245)),
      "2026-04-20__refactor__fixture.md",
    );
    expect(r.sections.intent).toBe("PASS");
    expect(r.passed).toBe(true);
  });

  it("refactor-intent-260-fail: REFACTOR at 260 words fails under 250-word cap", () => {
    const r = scoreSpec(
      refactorBase(makeWords(260)),
      "2026-04-20__refactor__fixture.md",
    );
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/250-word cap/);
    expect(r.section_reasons.intent).toMatch(/REFACTOR/);
  });

  it("research-intent-195-pass: RESEARCH at 195 words passes under 200-word cap", () => {
    const r = scoreSpec(
      researchBase(makeWords(195)),
      "2026-04-20__research__fixture.md",
    );
    expect(r.sections.intent).toBe("PASS");
    expect(r.passed).toBe(true);
  });

  it("research-intent-210-fail: RESEARCH at 210 words fails under 200-word cap", () => {
    const r = scoreSpec(
      researchBase(makeWords(210)),
      "2026-04-20__research__fixture.md",
    );
    expect(r.sections.intent).toBe("FAIL");
    expect(r.section_reasons.intent).toMatch(/200-word cap/);
    expect(r.section_reasons.intent).toMatch(/RESEARCH/);
  });

  it("feat-intent-145-pass: FEAT at 145 words still passes under unchanged 150-word cap", () => {
    const r = scoreSpec(
      featSpec.replace(
        /## Intent\nA tight paragraph[^\n]*/,
        `## Intent\n${makeWords(145)}`,
      ),
      "2026-04-13__feat__x.md",
    );
    expect(r.sections.intent).toBe("PASS");
  });

  it("chore-intent-95-pass: CHORE at 95 words still passes under unchanged 100-word cap", () => {
    const r = scoreSpec(
      choreSpec.replace(/## Intent\nBump dep\.\n/, `## Intent\n${makeWords(95)}\n`),
      "2026-04-13__chore__x.md",
    );
    expect(r.sections.intent).toBe("PASS");
  });
});

// ─── v1.4.0 Work Estimate ─────────────────────────────────────────────────
//
// 1 backward-compat test per type + 1 positive + 9 negative failure-mode
// tests covering every branch in checkWorkEstimate.

describe("v1.4.0 — backward compatibility (pre-v1.4.0 fixtures lack Work Estimate)", () => {
  const cases: { type: SpecType; spec: string; filename: string; preCount: number }[] = [
    { type: "feat", spec: featSpec, filename: "2026-04-12__feat__legacy.md", preCount: 9 },
    { type: "bug", spec: bugSpec, filename: "2026-04-12__bug__legacy.md", preCount: 7 },
    { type: "hotfix", spec: hotfixSpec, filename: "2026-04-12__hotfix__legacy.md", preCount: 7 },
    { type: "spec", spec: specSpec, filename: "2026-04-12__spec__legacy.md", preCount: 6 },
    { type: "chore", spec: choreSpec, filename: "2026-04-12__chore__legacy.md", preCount: 5 },
    { type: "refactor", spec: refactorSpec, filename: "2026-04-12__refactor__legacy.md", preCount: 9 },
    { type: "research", spec: researchSpec, filename: "2026-04-12__research__legacy.md", preCount: 6 },
    { type: "ux", spec: uxSpec, filename: "2026-04-12__ux__legacy.md", preCount: 6 },
    { type: "brand", spec: brandSpec, filename: "2026-04-12__brand__legacy.md", preCount: 6 },
  ];
  for (const { type, spec, filename, preCount } of cases) {
    it(`${type}: pre-v1.4.0 fixture (no Work Estimate) fails ONLY work_estimate; other sections still pass`, () => {
      const r = scoreSpec(spec, filename);
      expect(r.required_count).toBe(preCount + 1);
      expect(r.sections.work_estimate).toBe("FAIL");
      expect(r.section_reasons.work_estimate).toMatch(/Work Estimate/i);
      expect(r.passed).toBe(false);
      // Every other check still PASSes (proves the new check is the only
      // failing one — the rest of the rubric is unchanged).
      for (const key of r.section_order) {
        if (key !== "work_estimate") {
          expect(r.sections[key]).toBe("PASS");
        }
      }
    });
  }
});

describe("v1.4.0 — Work Estimate positive case", () => {
  it("a fully-compliant Work Estimate section passes the work_estimate check", () => {
    const r = scoreSpec(featSpec140, "2026-05-01__feat__we-positive.md");
    expect(r.sections.work_estimate).toBe("PASS");
    expect(r.section_reasons.work_estimate).toBeNull();
  });
});

describe("v1.4.0 — Work Estimate failure modes", () => {
  // Reusable mutator helper: replace the entire Work Estimate block.
  function withMutatedWorkEstimate(replacement: string): string {
    return featSpec + replacement;
  }

  it("missing ## Work Estimate H2", () => {
    const r = scoreSpec(featSpec, "2026-05-01__feat__we-1.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/"## Work Estimate" heading not found/);
  });

  it("missing ### Active operator time subsection", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Assumptions
- repo accessible

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-2.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Active operator time/);
  });

  it("missing ### Wall-clock time subsection", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Assumptions
- repo accessible

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-3.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Wall-clock time/);
  });

  it("missing ### Assumptions subsection", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-4.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Assumptions/);
  });

  it("missing ### Actuals (filled post-execution) subsection", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Assumptions
- repo accessible
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-5.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Actuals/);
  });

  it("Active operator time table without Total row", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Assumptions
- ok

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-6.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Active operator time.*Total row/);
  });

  it("Wall-clock time table without Total row", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |

### Assumptions
- ok

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-7.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Wall-clock time.*Total row/);
  });

  it("Assumptions section with no bullets", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Assumptions
just a paragraph with no bullets at all.

### Actuals (filled post-execution)
| Phase | Estimate | Actual | Delta | Note |
|---|---|---|---|---|
| Phase A | 5 min | TBD | TBD | |
| **Total** | **5 min** | **TBD** | **TBD** | |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-8.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Assumptions.*no bullets/);
  });

  it("Actuals table missing required column headers", () => {
    const md = withMutatedWorkEstimate(`
## Work Estimate

### Active operator time
| Phase | Estimate | Notes |
|---|---|---|
| Phase A | 5 min | |
| **Total active** | **5 min** | |

### Wall-clock time
| Wait dependency | Estimate | Notes |
|---|---|---|
| Review | 1 hr | |
| **Total wall-clock** | **1 hr** | |

### Assumptions
- ok

### Actuals (filled post-execution)
| Phase | Estimate | Note |
|---|---|---|
| Phase A | 5 min | TBD |
| **Total** | **5 min** | **TBD** |
`);
    const r = scoreSpec(md, "2026-05-01__feat__we-9.md");
    expect(r.sections.work_estimate).toBe("FAIL");
    expect(r.section_reasons.work_estimate).toMatch(/Actuals.*missing required column headers/);
    expect(r.section_reasons.work_estimate).toMatch(/Actual/);
    expect(r.section_reasons.work_estimate).toMatch(/Delta/);
  });
});
