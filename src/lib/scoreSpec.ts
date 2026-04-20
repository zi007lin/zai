export type SectionStatus = "PASS" | "FAIL" | "SKIP";

export type SpecType =
  | "feat"
  | "bug"
  | "hotfix"
  | "spec"
  | "chore"
  | "refactor"
  | "research"
  | "ux"
  | "brand";

export interface ScoreResult {
  rubric_version: string;
  spec_type: SpecType;
  score: string;
  required_count: number;
  passed: boolean;
  evaluated_at: string;
  sections: Record<string, SectionStatus>;
  section_reasons: Record<string, string | null>;
  section_order: string[];
  section_labels: Record<string, string>;
  gates: string[];
}

export class SpecTypeError extends Error {
  constructor(raw: string, known: readonly string[]) {
    super(
      `Unknown spec type "${raw}". Known: ${known.join(", ")}. Rename the file or add the type to ZAI_SYSTEM_INSTRUCTIONS.md.`,
    );
    this.name = "SpecTypeError";
  }
}

const RUBRIC_VERSION = "1.2.1";

// ─── helpers ──────────────────────────────────────────────────────────────

function sectionBody(markdown: string, headingPattern: RegExp): string {
  const start = markdown.search(headingPattern);
  if (start === -1) return "";
  const afterHeading = markdown.slice(start).replace(headingPattern, "");
  const nextHeading = afterHeading.search(/^##\s+/m);
  return nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
}

function headingPresent(markdown: string, pattern: RegExp): boolean {
  return pattern.test(markdown);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function tablePresent(body: string): boolean {
  return /\|.*\|.*\n\|[\s-:|]+\|/.test(body);
}

function codeBlockPresent(body: string): boolean {
  return /```[\s\S]*?```/.test(body);
}

function checkboxCount(body: string): number {
  return (body.match(/^- \[[ xX]\]/gm) || []).length;
}

function subheadingCount(body: string): number {
  return (body.match(/^###\s+/gm) || []).length;
}

function numberedListCount(body: string): number {
  return (body.match(/^\d+\.\s+/gm) || []).length;
}

function bulletListCount(body: string): number {
  return (body.match(/^[-*]\s+/gm) || []).length;
}

function openQuestionsNotEmpty(body: string): boolean {
  const row = body.match(/\|\s*Open\s+questions\s*\|([^|\n]*)\|/i);
  if (!row) return false;
  return row[1].trim().length > 0;
}

function acceptanceCriteriaCheckboxes(markdown: string): number {
  const heading = /^##\s+Acceptance\s+Criteria\b/mi;
  const start = markdown.search(heading);
  if (start === -1) return 0;
  const body = markdown.slice(start).replace(heading, "");
  const nextHeading = body.search(/^##\s+/m);
  const slice = nextHeading === -1 ? body : body.slice(0, nextHeading);
  return checkboxCount(slice);
}

// ─── section check result ─────────────────────────────────────────────────

interface CheckResult {
  status: SectionStatus;
  reason: string | null;
}

function pass(): CheckResult {
  return { status: "PASS", reason: null };
}

function fail(reason: string): CheckResult {
  return { status: "FAIL", reason };
}

// ─── heading regexes ──────────────────────────────────────────────────────

const INTENT_HEADING = /^##\s+Intent\b/mi;
const DECISION_TREE_HEADING = /^##\s+Decision\s+Tree\b/mi;
const FINAL_SPEC_HEADING = /^##\s+Final\s+Spec\b/mi;
const ACCEPTANCE_CRITERIA_HEADING = /^##\s+Acceptance\s+Criteria\b/mi;
const GAME_THEORY_HEADING = /^##\s+Game\s+Theory(\s+Cooperative\s+Model(\s+review)?)?(\s+Review)?\b/mi;
const MIGRATION_HEADING = /^##\s+Subject\s+Migration\s+Summary\b/mi;
const FILES_CREATED_HEADING = /^##\s+Files(\s+created\s*\/\s*updated)?\b/mi;
const FILES_HEADING = /^##\s+Files\b/mi;
const FILES_OR_SCHEMA_HEADING = /^##\s+(Files|Schema|Files\s*\/\s*Schema|Assets)\b/mi;
const MODELS_APPLIED_HEADING = /^##\s+Models\s+Applied\b/mi;
const LEGAL_TRIGGERS_HEADING = /^##\s+Legal\s+triggers\b/mi;
const MIGRATION_PLAN_HEADING = /^##\s+Migration\s+Plan\b/mi;
const RESEARCH_QUESTIONS_HEADING = /^##\s+Research\s+Questions\b/mi;
const REPORT_FORMAT_HEADING = /^##\s+Report\s+Format\b/mi;
const REPRO_HEADING = /^##\s+Repro(duction)?(\s+Steps)?\b/mi;
const FIX_HEADING = /^##\s+Fix\b/mi;
const ACTION_HEADING = /^##\s+Action\b/mi;
const JOBS_HEADING = /^##\s+Jobs\s+To\s+Be\s+Done\b/mi;
const DESIGN_RATIONALE_HEADING = /^##\s+Design\s+Rationale\b/mi;
const RULES_OR_CONTENT_HEADING = /^##\s+(Rules|Content)\b/mi;

// ─── section checks ───────────────────────────────────────────────────────

function checkIntentStrict(md: string): CheckResult {
  if (!headingPresent(md, INTENT_HEADING))
    return fail('"## Intent" heading not found');
  const body = sectionBody(md, INTENT_HEADING);
  const words = wordCount(body);
  if (words === 0) return fail("intent section is empty");
  if (words > 150)
    return fail(`intent exceeds 150-word limit — found ${words} words`);
  return pass();
}

function checkIntentChore(md: string): CheckResult {
  if (!headingPresent(md, INTENT_HEADING))
    return fail('"## Intent" heading not found');
  const body = sectionBody(md, INTENT_HEADING);
  const words = wordCount(body);
  if (words === 0) return fail("intent section is empty");
  if (words > 100)
    return fail(`intent exceeds 100-word limit for chore — found ${words} words`);
  return pass();
}

function checkIntentLoose(md: string): CheckResult {
  if (!headingPresent(md, INTENT_HEADING))
    return fail('"## Intent" heading not found');
  return pass();
}

function checkDecisionTree(md: string): CheckResult {
  if (!headingPresent(md, DECISION_TREE_HEADING))
    return fail('"## Decision Tree" heading not found');
  const body = sectionBody(md, DECISION_TREE_HEADING);
  const hasTable = tablePresent(body);
  const hasTrigger = /trigger\s+for\s+change/i.test(body);
  if (!hasTable && !hasTrigger)
    return fail('missing decision table and "Trigger for change" statement');
  if (!hasTable) return fail('missing decision table (expected "| | |" pattern)');
  if (!hasTrigger) return fail('missing "Trigger for change" statement');
  return pass();
}

function checkFinalSpec(md: string): CheckResult {
  if (!headingPresent(md, FINAL_SPEC_HEADING))
    return fail('"## Final Spec" heading not found');
  return pass();
}

function checkAcceptanceCriteria(md: string, minBoxes: number): CheckResult {
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING))
    return fail('"## Acceptance Criteria" heading not found');
  const count = acceptanceCriteriaCheckboxes(md);
  if (count < minBoxes)
    return fail(
      `minimum ${minBoxes} acceptance criteria checkbox${minBoxes === 1 ? "" : "es"} required — found ${count}`,
    );
  return pass();
}

function checkAcceptanceCriteriaResearch(md: string): CheckResult {
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING))
    return fail('"## Acceptance Criteria" heading not found');
  const count = acceptanceCriteriaCheckboxes(md);
  if (count < 3)
    return fail(
      `minimum 3 acceptance criteria checkboxes required — found ${count}`,
    );
  if (!/report\s+(saved|is\s+complete)/i.test(md))
    return fail('missing "report saved" or "report is complete" phrase in acceptance criteria');
  return pass();
}

function checkGameTheory(md: string): CheckResult {
  if (!headingPresent(md, GAME_THEORY_HEADING))
    return fail('"## Game Theory Cooperative Model review" heading not found');
  const body = sectionBody(md, GAME_THEORY_HEADING);
  const missing: string[] = [];
  if (!/who\s+benefits/i.test(body)) missing.push('"Who benefits"');
  if (!/abuse\s+vector/i.test(body)) missing.push('"Abuse vector"');
  if (!/mitigation/i.test(body)) missing.push('"Mitigation"');
  if (missing.length > 0)
    return fail(`missing required subsections: ${missing.join(", ")}`);
  return pass();
}

function checkMigrationSummary(md: string): CheckResult {
  if (!headingPresent(md, MIGRATION_HEADING))
    return fail('"## Subject Migration Summary" heading not found');
  const body = sectionBody(md, MIGRATION_HEADING);
  if (!openQuestionsNotEmpty(body))
    return fail('"Open questions" row is empty or missing in migration table');
  return pass();
}

function checkFilesList(md: string): CheckResult {
  if (!headingPresent(md, FILES_CREATED_HEADING))
    return fail('"## Files" or "## Files created / updated" heading not found');
  if (!codeBlockPresent(sectionBody(md, FILES_CREATED_HEADING)))
    return fail("no code block found in Files section");
  return pass();
}

function checkFiles(md: string): CheckResult {
  if (!headingPresent(md, FILES_HEADING))
    return fail('"## Files" heading not found');
  if (!codeBlockPresent(sectionBody(md, FILES_HEADING)))
    return fail("no code block found in Files section");
  return pass();
}

function checkFilesOrSchema(md: string): CheckResult {
  if (!headingPresent(md, FILES_OR_SCHEMA_HEADING))
    return fail('"## Files" or "## Schema" or "## Assets" heading not found');
  if (!codeBlockPresent(sectionBody(md, FILES_OR_SCHEMA_HEADING)))
    return fail("no code block found in Files/Schema/Assets section");
  return pass();
}

function checkResearchQuestions(md: string): CheckResult {
  if (!headingPresent(md, RESEARCH_QUESTIONS_HEADING))
    return fail('"## Research Questions" heading not found');
  if (subheadingCount(sectionBody(md, RESEARCH_QUESTIONS_HEADING)) < 1)
    return fail("at least one ### subheading required under Research Questions");
  return pass();
}

function checkReportFormat(md: string): CheckResult {
  if (!headingPresent(md, REPORT_FORMAT_HEADING))
    return fail('"## Report Format" heading not found');
  return pass();
}

function checkRepro(md: string): CheckResult {
  if (!headingPresent(md, REPRO_HEADING))
    return fail('"## Repro" heading not found');
  return pass();
}

function checkFix(md: string): CheckResult {
  if (!headingPresent(md, FIX_HEADING))
    return fail('"## Fix" heading not found');
  return pass();
}

function checkAction(md: string): CheckResult {
  if (!headingPresent(md, ACTION_HEADING))
    return fail('"## Action" heading not found');
  const body = sectionBody(md, ACTION_HEADING);
  if (numberedListCount(body) < 1)
    return fail("expected a numbered step list under ## Action");
  return pass();
}

function checkLegalTriggers(md: string): CheckResult {
  if (!headingPresent(md, LEGAL_TRIGGERS_HEADING))
    return fail('"## Legal triggers" heading not found');
  return pass();
}

function checkModelsApplied(md: string): CheckResult {
  if (!headingPresent(md, MODELS_APPLIED_HEADING))
    return fail('"## Models Applied" heading not found');
  const body = sectionBody(md, MODELS_APPLIED_HEADING);
  const declarations = bulletListCount(body) + numberedListCount(body);
  if (declarations < 1)
    return fail("no model declarations found under ## Models Applied (expected bullet or numbered list)");
  return pass();
}

function checkMigrationPlan(md: string): CheckResult {
  if (!headingPresent(md, MIGRATION_PLAN_HEADING))
    return fail('"## Migration Plan" heading not found');
  const body = sectionBody(md, MIGRATION_PLAN_HEADING);
  if (!/^###\s+Rollback\b/mi.test(body))
    return fail('missing "### Rollback" subsection under ## Migration Plan');
  return pass();
}

function checkJobsToBeDone(md: string): CheckResult {
  if (!headingPresent(md, JOBS_HEADING))
    return fail('"## Jobs To Be Done" heading not found');
  const body = sectionBody(md, JOBS_HEADING);
  const jobs = bulletListCount(body) + numberedListCount(body);
  if (jobs < 3)
    return fail(`minimum 3 user jobs required — found ${jobs}`);
  if (jobs > 5)
    return fail(`maximum 5 user jobs (doc says 3–5) — found ${jobs}`);
  return pass();
}

function checkDesignRationale(md: string): CheckResult {
  if (!headingPresent(md, DESIGN_RATIONALE_HEADING))
    return fail('"## Design Rationale" heading not found');
  const body = sectionBody(md, DESIGN_RATIONALE_HEADING);
  if (!/^###\s+Interaction\s+of\s+Color\b/mi.test(body))
    return fail('missing "### Interaction of Color" subsection under ## Design Rationale');
  return pass();
}

function checkRulesOrContent(md: string): CheckResult {
  if (!headingPresent(md, RULES_OR_CONTENT_HEADING))
    return fail('"## Rules" or "## Content" heading not found');
  return pass();
}

// ─── section definitions per spec type ────────────────────────────────────

interface SectionDef {
  key: string;
  label: string;
  check: (md: string) => CheckResult;
}

const FEAT_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "decision_tree", label: "Decision Tree", check: checkDecisionTree },
  { key: "final_spec", label: "Final Spec", check: checkFinalSpec },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: (md) => checkAcceptanceCriteria(md, 3) },
  { key: "game_theory", label: "Game Theory Cooperative Model review", check: checkGameTheory },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files_list", label: "Files created / updated", check: checkFilesList },
  { key: "models_applied", label: "Models Applied", check: checkModelsApplied },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const BUG_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentLoose },
  { key: "repro", label: "Repro", check: checkRepro },
  { key: "fix", label: "Fix", check: checkFix },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: (md) => checkAcceptanceCriteria(md, 2) },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files", label: "Files", check: checkFiles },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const HOTFIX_SECTIONS: SectionDef[] = BUG_SECTIONS;

const SPEC_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "decision_tree", label: "Decision Tree", check: checkDecisionTree },
  { key: "rules_or_content", label: "Rules or Content", check: checkRulesOrContent },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files_schema", label: "Files / Schema", check: checkFilesOrSchema },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const CHORE_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentChore },
  { key: "action", label: "Action", check: checkAction },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: (md) => checkAcceptanceCriteria(md, 1) },
  { key: "files", label: "Files", check: checkFiles },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const REFACTOR_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "decision_tree", label: "Decision Tree", check: checkDecisionTree },
  { key: "final_spec", label: "Final Spec", check: checkFinalSpec },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: (md) => checkAcceptanceCriteria(md, 3) },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files_list", label: "Files created / updated", check: checkFilesList },
  { key: "models_applied", label: "Models Applied", check: checkModelsApplied },
  { key: "migration_plan", label: "Migration Plan", check: checkMigrationPlan },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const RESEARCH_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "research_questions", label: "Research Questions", check: checkResearchQuestions },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: checkAcceptanceCriteriaResearch },
  { key: "report_format", label: "Report Format", check: checkReportFormat },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files", label: "Files", check: checkFiles },
];

const UX_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "jobs_to_be_done", label: "Jobs To Be Done", check: checkJobsToBeDone },
  { key: "design_rationale", label: "Design Rationale", check: checkDesignRationale },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: (md) => checkAcceptanceCriteria(md, 2) },
  { key: "assets_files", label: "Assets / Files", check: checkFilesOrSchema },
  { key: "legal_triggers", label: "Legal triggers", check: checkLegalTriggers },
];

const BRAND_SECTIONS: SectionDef[] = UX_SECTIONS;

export const SECTIONS_BY_TYPE: Record<SpecType, SectionDef[]> = {
  feat: FEAT_SECTIONS,
  bug: BUG_SECTIONS,
  hotfix: HOTFIX_SECTIONS,
  spec: SPEC_SECTIONS,
  chore: CHORE_SECTIONS,
  refactor: REFACTOR_SECTIONS,
  research: RESEARCH_SECTIONS,
  ux: UX_SECTIONS,
  brand: BRAND_SECTIONS,
};

// Ordered canonical section keys per type. Exported for the drift-detection
// test so it can compare against ZAI_SYSTEM_INSTRUCTIONS.md §Appendix.
export const RUBRIC_SECTION_KEYS: Record<SpecType, string[]> = {
  feat: FEAT_SECTIONS.map((s) => s.key),
  bug: BUG_SECTIONS.map((s) => s.key),
  hotfix: HOTFIX_SECTIONS.map((s) => s.key),
  spec: SPEC_SECTIONS.map((s) => s.key),
  chore: CHORE_SECTIONS.map((s) => s.key),
  refactor: REFACTOR_SECTIONS.map((s) => s.key),
  research: RESEARCH_SECTIONS.map((s) => s.key),
  ux: UX_SECTIONS.map((s) => s.key),
  brand: BRAND_SECTIONS.map((s) => s.key),
};

// ─── type detection ───────────────────────────────────────────────────────

export const KNOWN_TYPES: readonly SpecType[] = [
  "feat",
  "bug",
  "hotfix",
  "spec",
  "chore",
  "refactor",
  "research",
  "ux",
  "brand",
];

export function detectSpecType(filename: string): SpecType {
  const basename = filename.split(/[\\/]/).pop() || filename;
  const match = basename.match(/^\d{4}-\d{2}-\d{2}__(\w+)__/);
  if (!match) {
    throw new SpecTypeError(
      `(no type prefix in filename "${basename}")`,
      KNOWN_TYPES,
    );
  }
  const raw = match[1].toLowerCase();
  if (raw === "feature") return "feat";
  if ((KNOWN_TYPES as readonly string[]).includes(raw)) {
    return raw as SpecType;
  }
  throw new SpecTypeError(raw, KNOWN_TYPES);
}

// ─── gate extraction ──────────────────────────────────────────────────────

function extractGates(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const gates: string[] = [];
  const re = /- \[[ xX]\]\s+\*\*Pre-deploy gate[:\s*]*\*?\s*(.+)$/i;
  for (const line of lines) {
    const m = line.match(re);
    if (m) gates.push(m[1].trim().replace(/\*+$/, "").trim());
  }
  return gates;
}

// ─── entry point ──────────────────────────────────────────────────────────

export function scoreSpec(markdown: string, filename: string = ""): ScoreResult {
  const specType = detectSpecType(filename);
  const defs = SECTIONS_BY_TYPE[specType];

  const sections: Record<string, SectionStatus> = {};
  const section_reasons: Record<string, string | null> = {};
  const section_labels: Record<string, string> = {};
  const section_order: string[] = [];
  for (const def of defs) {
    const result = def.check(markdown);
    sections[def.key] = result.status;
    section_reasons[def.key] = result.reason;
    section_labels[def.key] = def.label;
    section_order.push(def.key);
  }

  const required_count = defs.length;
  const passOrSkip = Object.values(sections).filter(
    (s) => s === "PASS" || s === "SKIP",
  ).length;
  const passed = Object.values(sections).every((s) => s !== "FAIL");
  const gates = extractGates(markdown);

  return {
    rubric_version: RUBRIC_VERSION,
    spec_type: specType,
    score: `${passOrSkip}/${required_count}`,
    required_count,
    passed,
    evaluated_at: new Date().toISOString(),
    sections,
    section_reasons,
    section_order,
    section_labels,
    gates,
  };
}
