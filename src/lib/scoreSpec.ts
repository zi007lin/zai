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

function checkIntentStrict(md: string): SectionStatus {
  if (!headingPresent(md, INTENT_HEADING)) return "FAIL";
  const body = sectionBody(md, INTENT_HEADING);
  const words = wordCount(body);
  return words > 0 && words <= 150 ? "PASS" : "FAIL";
}

function checkIntentLoose(md: string): SectionStatus {
  return headingPresent(md, INTENT_HEADING) ? "PASS" : "FAIL";
}

function checkDecisionTree(md: string): SectionStatus {
  if (!headingPresent(md, DECISION_TREE_HEADING)) return "FAIL";
  const body = sectionBody(md, DECISION_TREE_HEADING);
  const hasTable = tablePresent(body);
  const hasTrigger = /trigger\s+for\s+change/i.test(body);
  return hasTable && hasTrigger ? "PASS" : "FAIL";
}

function checkDraftOfThoughts(md: string): SectionStatus {
  return headingPresent(md, DRAFT_HEADING) ? "PASS" : "SKIP";
}

function checkFinalSpec(md: string): SectionStatus {
  if (!headingPresent(md, FINAL_SPEC_HEADING)) return "FAIL";
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING)) return "FAIL";
  return acceptanceCriteriaCheckboxes(md) >= 3 ? "PASS" : "FAIL";
}

function checkGameTheory(md: string): SectionStatus {
  if (!headingPresent(md, GAME_THEORY_HEADING)) return "FAIL";
  const body = sectionBody(md, GAME_THEORY_HEADING);
  const ok =
    /who\s+benefits/i.test(body) &&
    /abuse\s+vector/i.test(body) &&
    /mitigation/i.test(body);
  return ok ? "PASS" : "FAIL";
}

function checkMigrationSummary(md: string): SectionStatus {
  if (!headingPresent(md, MIGRATION_HEADING)) return "FAIL";
  const body = sectionBody(md, MIGRATION_HEADING);
  return openQuestionsNotEmpty(body) ? "PASS" : "FAIL";
}

function checkFilesList(md: string): SectionStatus {
  if (!headingPresent(md, FILES_HEADING)) return "FAIL";
  return codeBlockPresent(sectionBody(md, FILES_HEADING)) ? "PASS" : "FAIL";
}

function checkResearchQuestions(md: string): SectionStatus {
  if (!headingPresent(md, RESEARCH_QUESTIONS_HEADING)) return "FAIL";
  return subheadingCount(sectionBody(md, RESEARCH_QUESTIONS_HEADING)) >= 1
    ? "PASS"
    : "FAIL";
}

function checkAcceptanceCriteriaResearch(md: string): SectionStatus {
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING)) return "FAIL";
  if (acceptanceCriteriaCheckboxes(md) < 3) return "FAIL";
  return /report\s+saved/i.test(md) ? "PASS" : "FAIL";
}

function checkReportFormat(md: string): SectionStatus {
  return headingPresent(md, REPORT_FORMAT_HEADING) ? "PASS" : "FAIL";
}

function checkReproSteps(md: string): SectionStatus {
  return headingPresent(md, REPRO_HEADING) ? "PASS" : "FAIL";
}

function checkBugFixSection(md: string): SectionStatus {
  if (!headingPresent(md, FIX_HEADING)) return "FAIL";
  if (!headingPresent(md, ACCEPTANCE_CRITERIA_HEADING)) return "FAIL";
  return acceptanceCriteriaCheckboxes(md) >= 2 ? "PASS" : "FAIL";
}

function checkMigrationSummaryBug(md: string): SectionStatus {
  if (!headingPresent(md, MIGRATION_HEADING)) return "FAIL";
  const body = sectionBody(md, MIGRATION_HEADING);
  return openQuestionsNotEmpty(body) ? "PASS" : "FAIL";
}

// ─── section definitions per spec type ────────────────────────────────────

interface SectionDef {
  key: string;
  label: string;
  check: (md: string) => SectionStatus;
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
  const section_labels: Record<string, string> = {};
  const section_order: string[] = [];
  for (const def of defs) {
    sections[def.key] = def.check(markdown);
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
    section_order,
    section_labels,
    gates,
  };
}
