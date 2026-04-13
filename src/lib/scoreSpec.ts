export type SectionStatus = "PASS" | "FAIL" | "SKIP";

export type SectionKey =
  | "intent"
  | "decision_tree"
  | "draft_of_thoughts"
  | "final_spec"
  | "game_theory"
  | "migration_summary"
  | "files_list";

export interface ScoreResult {
  rubric_version: string;
  score: string;
  passed: boolean;
  evaluated_at: string;
  sections: Record<SectionKey, SectionStatus>;
  gates: string[];
}

const RUBRIC_VERSION = "1.0.0";

const HEADING_PATTERNS: Record<SectionKey, RegExp> = {
  intent: /^##\s+Intent\b/mi,
  decision_tree: /^##\s+Decision\s+Tree\b/mi,
  draft_of_thoughts: /^##\s+Draft[-\s]of[-\s]thoughts\b/mi,
  final_spec: /^##\s+Final\s+Spec\b/mi,
  game_theory: /^##\s+Game\s+Theory(\s+Review)?\b/mi,
  migration_summary: /^##\s+Subject\s+Migration\s+Summary\b/mi,
  files_list: /^##\s+Files\b/mi,
};

function sectionBody(markdown: string, key: SectionKey): string {
  const start = markdown.search(HEADING_PATTERNS[key]);
  if (start === -1) return "";
  const afterHeading = markdown.slice(start).replace(HEADING_PATTERNS[key], "");
  const nextHeading = afterHeading.search(/^##\s+/m);
  return nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);
}

function checkIntent(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "intent");
  if (!body.trim()) return "FAIL";
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return words > 0 && words <= 150 ? "PASS" : "FAIL";
}

function checkDecisionTree(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "decision_tree");
  if (!body.trim()) return "FAIL";
  const hasTable = /\|.*\|.*\n\|[\s-:|]+\|/.test(body);
  const hasTrigger = /trigger\s+for\s+change/i.test(body);
  return hasTable && hasTrigger ? "PASS" : "FAIL";
}

function checkDraftOfThoughts(markdown: string): SectionStatus {
  return HEADING_PATTERNS.draft_of_thoughts.test(markdown) ? "PASS" : "SKIP";
}

function checkFinalSpec(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "final_spec");
  if (!body.trim()) return "FAIL";
  const hasAC = /^##\s+Acceptance\s+Criteria\b/mi.test(markdown);
  if (!hasAC) return "FAIL";
  const acStart = markdown.search(/^##\s+Acceptance\s+Criteria\b/mi);
  const acBody = markdown.slice(acStart).replace(/^##\s+Acceptance\s+Criteria\b/mi, "");
  const nextHeading = acBody.search(/^##\s+/m);
  const acSlice = nextHeading === -1 ? acBody : acBody.slice(0, nextHeading);
  const checkboxes = (acSlice.match(/^- \[[ xX]\]/gm) || []).length;
  return checkboxes >= 3 ? "PASS" : "FAIL";
}

function checkGameTheory(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "game_theory");
  if (!body.trim()) return "FAIL";
  const hasBenefits = /who\s+benefits/i.test(body);
  const hasAbuse = /abuse\s+vector/i.test(body);
  const hasMitigation = /mitigation/i.test(body);
  return hasBenefits && hasAbuse && hasMitigation ? "PASS" : "FAIL";
}

function checkMigrationSummary(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "migration_summary");
  if (!body.trim()) return "FAIL";
  const openRow = body.match(/\|\s*Open\s+questions\s*\|([^|\n]*)\|/i);
  if (!openRow) return "FAIL";
  const value = openRow[1].trim();
  return value.length > 0 ? "PASS" : "FAIL";
}

function checkFilesList(markdown: string): SectionStatus {
  const body = sectionBody(markdown, "files_list");
  if (!body.trim()) return "FAIL";
  return /```[\s\S]*?```/.test(body) ? "PASS" : "FAIL";
}

function extractGates(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const gates: string[] = [];
  const re = /- \[[ xX]\]\s+\*\*Pre-deploy gate[:\s*]*\*?\s*(.+)$/i;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      gates.push(m[1].trim().replace(/\*+$/, "").trim());
    }
  }
  return gates;
}

export function scoreSpec(markdown: string): ScoreResult {
  const sections: Record<SectionKey, SectionStatus> = {
    intent: checkIntent(markdown),
    decision_tree: checkDecisionTree(markdown),
    draft_of_thoughts: checkDraftOfThoughts(markdown),
    final_spec: checkFinalSpec(markdown),
    game_theory: checkGameTheory(markdown),
    migration_summary: checkMigrationSummary(markdown),
    files_list: checkFilesList(markdown),
  };
  const gates = extractGates(markdown);
  const passCount = Object.values(sections).filter((s) => s === "PASS").length;
  const skipCount = Object.values(sections).filter((s) => s === "SKIP").length;
  const passed = Object.values(sections).every((s) => s !== "FAIL");
  return {
    rubric_version: RUBRIC_VERSION,
    score: `${passCount + skipCount}/7`,
    passed,
    evaluated_at: new Date().toISOString(),
    sections,
    gates,
  };
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  intent: "Intent",
  decision_tree: "Decision Tree",
  draft_of_thoughts: "Draft-of-thoughts",
  final_spec: "Final Spec",
  game_theory: "Game Theory Review",
  migration_summary: "Subject Migration Summary",
  files_list: "Files list",
};

export const SECTION_ORDER: SectionKey[] = [
  "intent",
  "decision_tree",
  "draft_of_thoughts",
  "final_spec",
  "game_theory",
  "migration_summary",
  "files_list",
];
