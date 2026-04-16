export type SectionStatus = "PASS" | "FAIL" | "SKIP";

export type SpecType = "feat" | "research" | "bug" | "chore" | "hotfix";

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

const RUBRIC_VERSION = "1.1.0";

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

function skip(): CheckResult {
  return { status: "SKIP", reason: null };
}

function fail(reason: string): CheckResult {
  return { status: "FAIL", reason };
}

// ─── section checks ───────────────────────────────────────────────────────

const INTENT_HEADING = /^##\s+Intent\b/mi;
const DECISION_TREE_HEADING = /^##\s+Decision\s+Tree\b/mi;
const DRAFT_HEADING = /^##\s+Draft[-\s]of[-\s]thoughts\b/mi;
const FINAL_SPEC_HEADING = /^##\s+Final\s+Spec\b/mi;
const GAME_THEORY_HEADING = /^##\s+Game\s+Theory(\s+Review)?\b/mi;
const MIGRATION_HEADING = /^##\s+Subject\s+Migration\s+Summary\b/mi;
const FILES_HEADING = /^##\s+Files\b/mi;
const RESEARCH_QUESTIONS_HEADING = /^##\s+Research\s+Questions\b/mi;
const ACCEPTANCE_CRITERIA_HEADING = /^##\s+Acceptance\s+Criteria\b/mi;
const REPORT_FORMAT_HEADING = /^##\s+Report\s+Format\b/mi;
const REPRO_HEADING = /^##\s+Repro(duction)?(\s+Steps)?\b/mi;
const FIX_HEADING = /^##\s+Fix\b/mi;

function checkIntentStrict(md: string): CheckResult {
  if (!headingPresent(md, INTENT_HEADING))
    return fail("\"## Intent\" heading not found");
  const body = sectionBody(md, INTENT_HEADING);
  const words = wordCount(body);
  if (words === 0) return fail("intent section is empty");
  if (words > 150)
    return fail(`intent exceeds 150-word limit — found ${words} words`);
  return pass();
}

function checkIntentLoose(md: string): CheckResult {
  if (!headingPresent(md, INTENT_HEADING))
    return fail("\"## Intent\" heading not found");
  return pass();
}

function checkDecisionTree(md: string): CheckResult {
  if (!headingPresent(md, DECISION_TREE_HEADING))
    return fail("\"## Decision Tree\" heading not found");
  const body = sectionBody(md, DECISION_TREE_HEADING);
  const hasTable = tablePresent(body);
  const hasTrigger = /trigger\s+for\s+change/i.test(body);
  if (!hasTable && !hasTrigger)
    return fail("missing decision table and \"Trigger for change\" statement");
  if (!hasTable) return fail("missing decision table (expected \"| | |\" pattern)");
  if (!hasTrigger) return fail("missing \"Trigger for change\" statement");
  return pass();
}

function checkDraftOfThoughts(md: string): CheckResult {
  return headingPresent(md, DRAFT_HEADING) ? pass() : skip();
}

function checkFinalSpec(md: string): CheckResult {
  if (!headingPresent(md, FINAL_SPEC_HEADING))
    return fail("\"## Final Spec\" heading not found");
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING))
    return fail("\"## Acceptance Criteria\" heading not found");
  const count = acceptanceCriteriaCheckboxes(md);
  if (count < 3)
    return fail(
      `minimum 3 acceptance criteria checkboxes required — found ${count}`
    );
  return pass();
}

function checkGameTheory(md: string): CheckResult {
  if (!headingPresent(md, GAME_THEORY_HEADING))
    return fail("\"## Game Theory\" heading not found");
  const body = sectionBody(md, GAME_THEORY_HEADING);
  const missing: string[] = [];
  if (!/who\s+benefits/i.test(body)) missing.push("\"Who benefits\"");
  if (!/abuse\s+vector/i.test(body)) missing.push("\"Abuse vector\"");
  if (!/mitigation/i.test(body)) missing.push("\"Mitigation\"");
  if (missing.length > 0)
    return fail(`missing required subsections: ${missing.join(", ")}`);
  return pass();
}

function checkMigrationSummary(md: string): CheckResult {
  if (!headingPresent(md, MIGRATION_HEADING))
    return fail("\"## Subject Migration Summary\" heading not found");
  const body = sectionBody(md, MIGRATION_HEADING);
  if (!openQuestionsNotEmpty(body))
    return fail("\"Open questions\" row is empty or missing in migration table");
  return pass();
}

function checkFilesList(md: string): CheckResult {
  if (!headingPresent(md, FILES_HEADING))
    return fail("\"## Files\" heading not found");
  if (!codeBlockPresent(sectionBody(md, FILES_HEADING)))
    return fail("no code block found in Files section");
  return pass();
}

function checkResearchQuestions(md: string): CheckResult {
  if (!headingPresent(md, RESEARCH_QUESTIONS_HEADING))
    return fail("\"## Research Questions\" heading not found");
  if (subheadingCount(sectionBody(md, RESEARCH_QUESTIONS_HEADING)) < 1)
    return fail("at least one ### subheading required under Research Questions");
  return pass();
}

function checkAcceptanceCriteriaResearch(md: string): CheckResult {
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING))
    return fail("\"## Acceptance Criteria\" heading not found");
  const count = acceptanceCriteriaCheckboxes(md);
  if (count < 3)
    return fail(
      `minimum 3 acceptance criteria checkboxes required — found ${count}`
    );
  if (!/report\s+saved/i.test(md))
    return fail("missing \"report saved\" reference in acceptance criteria");
  return pass();
}

function checkReportFormat(md: string): CheckResult {
  if (!headingPresent(md, REPORT_FORMAT_HEADING))
    return fail("\"## Report Format\" heading not found");
  return pass();
}

function checkReproSteps(md: string): CheckResult {
  if (!headingPresent(md, REPRO_HEADING))
    return fail("\"## Repro\" heading not found");
  return pass();
}

function checkBugFixSection(md: string): CheckResult {
  if (!headingPresent(md, FIX_HEADING))
    return fail("\"## Fix\" heading not found");
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING))
    return fail("\"## Acceptance Criteria\" heading not found");
  const count = acceptanceCriteriaCheckboxes(md);
  if (count < 2)
    return fail(
      `minimum 2 acceptance criteria checkboxes required — found ${count}`
    );
  return pass();
}

function checkMigrationSummaryBug(md: string): CheckResult {
  if (!headingPresent(md, MIGRATION_HEADING))
    return fail("\"## Subject Migration Summary\" heading not found");
  const body = sectionBody(md, MIGRATION_HEADING);
  if (!openQuestionsNotEmpty(body))
    return fail("\"Open questions\" row is empty or missing in migration table");
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
  { key: "draft_of_thoughts", label: "Draft-of-thoughts", check: checkDraftOfThoughts },
  { key: "final_spec", label: "Final Spec", check: checkFinalSpec },
  { key: "game_theory", label: "Game Theory Review", check: checkGameTheory },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files_list", label: "Files list", check: checkFilesList },
];

const RESEARCH_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentStrict },
  { key: "research_questions", label: "Research Questions", check: checkResearchQuestions },
  { key: "acceptance_criteria", label: "Acceptance Criteria", check: checkAcceptanceCriteriaResearch },
  { key: "report_format", label: "Report Format", check: checkReportFormat },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummary },
  { key: "files_list", label: "Files list", check: checkFilesList },
];

const BUG_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentLoose },
  { key: "reproduction_steps", label: "Reproduction Steps", check: checkReproSteps },
  { key: "fix", label: "Fix", check: checkBugFixSection },
  { key: "migration_summary", label: "Subject Migration Summary", check: checkMigrationSummaryBug },
  { key: "files_list", label: "Files list", check: checkFilesList },
];

const CHORE_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentLoose },
  { key: "files_list", label: "Files list", check: checkFilesList },
];

const HOTFIX_SECTIONS: SectionDef[] = [
  { key: "intent", label: "Intent", check: checkIntentLoose },
  { key: "fix", label: "Fix", check: checkBugFixSection },
  { key: "files_list", label: "Files list", check: checkFilesList },
];

const SECTIONS_BY_TYPE: Record<SpecType, SectionDef[]> = {
  feat: FEAT_SECTIONS,
  research: RESEARCH_SECTIONS,
  bug: BUG_SECTIONS,
  chore: CHORE_SECTIONS,
  hotfix: HOTFIX_SECTIONS,
};

// ─── type detection ───────────────────────────────────────────────────────

const KNOWN_TYPES: SpecType[] = ["feat", "research", "bug", "chore", "hotfix"];

export function detectSpecType(filename: string): SpecType {
  const basename = filename.split(/[\\/]/).pop() || filename;
  const match = basename.match(/^\d{4}-\d{2}-\d{2}__(\w+)__/);
  const raw = match?.[1]?.toLowerCase() ?? "feat";
  if (raw === "feature") return "feat";
  if (raw === "refactor") return "chore";
  return (KNOWN_TYPES as string[]).includes(raw) ? (raw as SpecType) : "feat";
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
    (s) => s === "PASS" || s === "SKIP"
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
