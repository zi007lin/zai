import { RUBRIC_SECTION_KEYS, SECTIONS_BY_TYPE, type SpecType } from "./scoreSpec";

export const TEMPLATE_TYPES = ["feat", "bug"] as const;
export type TemplateSpecType = (typeof TEMPLATE_TYPES)[number];
type TemplateSection = { key: string; body: string };

const COMMON_WORK_ESTIMATE = `### Active operator time

| Phase | Estimate |
|---|---:|
| Implementation | <!-- duration --> |
| Total | <!-- duration --> |

### Wall-clock time

| Wait dependency | Estimate |
|---|---:|
| Review and deployment | <!-- duration --> |
| Total | <!-- duration --> |

### Assumptions

- <!-- assumption behind the estimate -->

### Actuals (filled post-execution)

| Phase | Estimate | Actual | Delta |
|---|---:|---:|---:|
| Implementation | <!-- duration --> | TBD | TBD |
| Total | <!-- duration --> | TBD | TBD |`;

const SECTIONS: Record<TemplateSpecType, TemplateSection[]> = {
  feat: [
    { key: "intent", body: "<!-- One paragraph, ≤ 150 words. State the change and motivation. -->" },
    { key: "decision_tree", body: `**Question:** <!-- decision being made -->

| Option | Risk | Decision |
|---|---|---|
| Option A | Low | Chosen |
| Option B | High | Rejected |

**Trigger for change:** <!-- evidence that would reverse the decision -->` },
    { key: "final_spec", body: "<!-- Concrete behavior, scope, and rendering or implementation rules. -->" },
    { key: "acceptance_criteria", body: "- [ ] First concrete outcome\n- [ ] Second concrete outcome\n- [ ] Third concrete outcome" },
    { key: "game_theory", body: "**Who benefits:** <!-- beneficiary -->\n\n**Abuse vector:** <!-- misuse or failure mode -->\n\n**Mitigation:** <!-- control or bound -->" },
    { key: "migration_summary", body: "| Subject | From | To |\n|---|---|---|\n| <!-- subject --> | <!-- current state --> | <!-- target state --> |\n| Open questions | <!-- unresolved item --> | <!-- next action --> |" },
    { key: "files_list", body: "```text\npath/to/file-to-change.ts\npath/to/new-file.ts\n```" },
    { key: "models_applied", body: "- <!-- Name a reasoning or domain model and explain how it shaped the design. -->" },
    { key: "legal_triggers", body: "<!-- State applicable legal/compliance triggers, or explain why none apply. -->" },
    { key: "work_estimate", body: COMMON_WORK_ESTIMATE },
  ],
  bug: [
    { key: "intent", body: "<!-- One paragraph, ≤ 150 words. State the defect and why it matters. -->" },
    { key: "repro", body: "1. <!-- first deterministic reproduction step -->\n2. <!-- second step -->\n3. <!-- observed result and expected result -->" },
    { key: "fix", body: "<!-- Describe the bounded correction without weakening the governing rule. -->" },
    { key: "acceptance_criteria", body: "- [ ] First verified outcome\n- [ ] Second verified outcome" },
    { key: "migration_summary", body: "| Subject | From | To |\n|---|---|---|\n| <!-- subject --> | <!-- broken state --> | <!-- corrected state --> |\n| Open questions | <!-- unresolved item --> | <!-- next action --> |" },
    { key: "files", body: "```text\npath/to/file-to-change.ts\npath/to/test-to-change.test.ts\n```" },
    { key: "legal_triggers", body: "<!-- State applicable legal/compliance triggers, or explain why none apply. -->" },
    { key: "work_estimate", body: COMMON_WORK_ESTIMATE },
  ],
};

function assertSynchronized(type: TemplateSpecType, sections: TemplateSection[]) {
  const actual = sections.map(({ key }) => key);
  const expected = RUBRIC_SECTION_KEYS[type];
  if (actual.length !== expected.length || actual.some((key, i) => key !== expected[i])) {
    throw new Error(`Template sections for ${type} are not synchronized with the live rubric`);
  }
}

export function templateFilename(type: TemplateSpecType, date = "YYYY-MM-DD") {
  return `${date}__${type}__short-title.md`;
}

export function getSpecTemplate(type: TemplateSpecType): string {
  const sections = SECTIONS[type];
  assertSynchronized(type, sections);
  const labels = new Map(SECTIONS_BY_TYPE[type].map(({ key, label }) => [key, label]));
  const rendered = sections.map(({ key, body }) => `## ${labels.get(key)}\n\n${body}`).join("\n\n---\n\n");
  return `# ${templateFilename(type)}\n\n${rendered}\n`;
}

export function templateSectionKeys(type: TemplateSpecType): readonly string[] {
  return SECTIONS[type].map(({ key }) => key);
}

export const SPEC_TEMPLATE = getSpecTemplate("feat");

export function isTemplateSpecType(type: SpecType): type is TemplateSpecType {
  return TEMPLATE_TYPES.includes(type as TemplateSpecType);
}
