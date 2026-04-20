import type { ScoreResult } from "./scoreSpec";

// Enterprise-disclosure trigger bundles per ZAI_SYSTEM_INSTRUCTIONS.md v1.3.
// Canonical match uses lowercase + underscore equivalence for hyphen input.
export const TRIGGER_BUNDLES: readonly string[] = [
  "healthcare",
  "fintech",
  "financial_advisory",
  "legal_services",
  "government",
];

// Canonical disclosure text — must match docs/brand/enterprise-disclosure.md
// verbatim. The test suite asserts this equality to catch drift between the
// rubric implementation and the brand doc.
export const ENTERPRISE_DISCLOSURE_TEXT =
  "**Dual-control disclosure.** The dual-control segregation in this workflow is process-level (author/reviewer via separate identities for one human principal). Principal-level segregation of duties — two independent human operators — is not yet in place at HTU. Clients with principal-level segregation requirements under HIPAA §164.308, SOX §404, FINRA 3110, or equivalent must arrange for an independent second operator before relying on this control.";

function normalizeBundle(raw: string): string {
  return raw.trim().toLowerCase().replace(/-/g, "_");
}

// Parse the `bundles:` array from YAML-style frontmatter at the top of the
// markdown. Returns [] if frontmatter is absent or the field is missing/empty.
// Accepts inline array form: `bundles: [healthcare, fintech]` or
// `bundles: []`. Block form (bundles:\n  - healthcare) is also accepted.
export function extractBundles(markdown: string): string[] {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return [];
  const fm = fmMatch[1];

  const inline = fm.match(/^bundles:\s*\[([^\]]*)\]\s*$/m);
  if (inline) {
    return inline[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const blockStart = fm.match(/^bundles:\s*$/m);
  if (blockStart) {
    const lines = fm.split("\n");
    const startIdx = lines.findIndex((l) => /^bundles:\s*$/.test(l));
    const collected: string[] = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const m = lines[i].match(/^\s*-\s*(.+)$/);
      if (!m) break;
      collected.push(m[1].trim());
    }
    return collected;
  }

  return [];
}

// Return the subset of the given bundle list that triggers the enterprise
// disclosure footer. Matching is case-insensitive with hyphen/underscore
// equivalence, so `Healthcare`, `healthcare`, `financial-advisory`, and
// `financial_advisory` all match canonical trigger bundle names.
export function matchTriggeredBundles(bundles: string[]): string[] {
  const normalizedTriggers = new Set(TRIGGER_BUNDLES.map(normalizeBundle));
  const matched: string[] = [];
  for (const b of bundles) {
    const n = normalizeBundle(b);
    if (normalizedTriggers.has(n) && !matched.includes(n)) {
      matched.push(n);
    }
  }
  return matched;
}

function renderScoreBlock(filename: string, result: ScoreResult): string {
  const lines: string[] = [];
  lines.push("## ZAI Spec Score");
  lines.push("");
  lines.push(`- **Rubric version:** ${result.rubric_version}`);
  lines.push(`- **Spec type:** ${result.spec_type}`);
  lines.push(`- **Evaluated at:** ${result.evaluated_at}`);
  lines.push(`- **Score:** ${result.score}`);
  lines.push(`- **Passed:** ${result.passed ? "YES" : "NO"}`);
  lines.push("");
  lines.push("| Section | Status |");
  lines.push("|---|---|");
  for (const [key, status] of Object.entries(result.sections)) {
    lines.push(`| ${key} | ${status} |`);
  }
  if (result.gates.length > 0) {
    lines.push("");
    lines.push("### Pre-deploy gates");
    for (const g of result.gates) lines.push(`- [ ] ${g}`);
  }
  lines.push("");
  lines.push(`_Source: ${filename}_`);
  return lines.join("\n");
}

function renderDisclosureFooter(matched: string[]): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Enterprise Compliance Disclosure");
  lines.push("");
  lines.push(ENTERPRISE_DISCLOSURE_TEXT);
  lines.push("");
  lines.push(`_Triggered by bundles: ${matched.join(", ")}._`);
  lines.push("_Reference: docs/brand/enterprise-disclosure.md._");
  return lines.join("\n");
}

// Render a `.scored.md` output by concatenating the original spec, a
// separator, the score block, and — when any bundle in the spec's frontmatter
// is in TRIGGER_BUNDLES — the enterprise disclosure footer appended after
// the score block. This is the output-layer integration point for rubric
// v1.3 per docs/brand/enterprise-disclosure.md and the Phase 0 design note
// "render in the output layer, not the scoring layer."
export function renderScoredSpec(
  filename: string,
  originalMarkdown: string,
  result: ScoreResult,
): string {
  const parts: string[] = [];
  parts.push(originalMarkdown.replace(/\s+$/, ""));
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push(renderScoreBlock(filename, result));

  const matched = matchTriggeredBundles(extractBundles(originalMarkdown));
  if (matched.length > 0) {
    parts.push(renderDisclosureFooter(matched));
  }

  parts.push("");
  return parts.join("\n");
}
