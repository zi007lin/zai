import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  renderScoredSpec,
  extractBundles,
  matchTriggeredBundles,
  TRIGGER_BUNDLES,
  ENTERPRISE_DISCLOSURE_TEXT,
} from "./renderScoredSpec";
import type { ScoreResult } from "./scoreSpec";

function makeResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    rubric_version: "1.3.0",
    spec_type: "feat",
    score: "9/9",
    required_count: 9,
    passed: true,
    evaluated_at: "2026-04-20T12:00:00.000Z",
    sections: { intent: "PASS" },
    section_reasons: { intent: null },
    section_order: ["intent"],
    section_labels: { intent: "Intent" },
    gates: [],
    ...overrides,
  };
}

const specWithHealthcare = `---
spec_type: feat
rubric_version: 1.3
bundles: [healthcare]
---

# Title

## Intent
Body.
`;

const specWithMultiTriggers = `---
spec_type: feat
bundles: [healthcare, fintech]
---

# Title
`;

const specEmptyBundles = `---
spec_type: feat
bundles: []
---

# Title
`;

const specNoBundlesField = `---
spec_type: feat
rubric_version: 1.3
---

# Title
`;

const specNonTriggerBundle = `---
spec_type: feat
bundles: [marketing, accessibility]
---

# Title
`;

const specMixedCaseBundle = `---
spec_type: feat
bundles: [Healthcare]
---

# Title
`;

const specHyphenVariant = `---
spec_type: feat
bundles: [financial-advisory]
---

# Title
`;

const specBlockFormBundles = `---
spec_type: feat
bundles:
  - healthcare
  - government
---

# Title
`;

// ─── extractBundles ──────────────────────────────────────────────────────

describe("extractBundles", () => {
  it("extracts inline array form", () => {
    expect(extractBundles(specWithHealthcare)).toEqual(["healthcare"]);
    expect(extractBundles(specWithMultiTriggers)).toEqual(["healthcare", "fintech"]);
  });

  it("returns empty array for empty bundles", () => {
    expect(extractBundles(specEmptyBundles)).toEqual([]);
  });

  it("returns empty array when bundles field absent", () => {
    expect(extractBundles(specNoBundlesField)).toEqual([]);
  });

  it("returns empty array when frontmatter absent", () => {
    expect(extractBundles("# Just a title\n\nNo frontmatter here.\n")).toEqual([]);
  });

  it("extracts block-style bundles", () => {
    expect(extractBundles(specBlockFormBundles)).toEqual(["healthcare", "government"]);
  });
});

// ─── matchTriggeredBundles ───────────────────────────────────────────────

describe("matchTriggeredBundles", () => {
  it("matches canonical trigger bundles", () => {
    expect(matchTriggeredBundles(["healthcare"])).toEqual(["healthcare"]);
    expect(matchTriggeredBundles(["fintech", "government"])).toEqual([
      "fintech",
      "government",
    ]);
  });

  it("is case-insensitive", () => {
    expect(matchTriggeredBundles(["Healthcare", "GOVERNMENT"])).toEqual([
      "healthcare",
      "government",
    ]);
  });

  it("treats hyphens and underscores as equivalent", () => {
    expect(matchTriggeredBundles(["financial-advisory"])).toEqual(["financial_advisory"]);
    expect(matchTriggeredBundles(["legal-services"])).toEqual(["legal_services"]);
  });

  it("ignores non-trigger bundles", () => {
    expect(matchTriggeredBundles(["marketing", "accessibility"])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(matchTriggeredBundles([])).toEqual([]);
  });

  it("exposes the canonical trigger bundle list (5 entries)", () => {
    expect(TRIGGER_BUNDLES.length).toBe(5);
    expect(TRIGGER_BUNDLES).toEqual([
      "healthcare",
      "fintech",
      "financial_advisory",
      "legal_services",
      "government",
    ]);
  });
});

// ─── renderScoredSpec — footer behavior (9 tests per rubric-v1.3-draft) ──

describe("renderScoredSpec — enterprise disclosure footer", () => {
  it("(1) emits footer for spec with bundles: [healthcare]", () => {
    const out = renderScoredSpec("x.md", specWithHealthcare, makeResult());
    expect(out).toContain("## Enterprise Compliance Disclosure");
    expect(out).toContain("Triggered by bundles: healthcare");
  });

  it("(2) emits footer with all matched trigger bundles listed", () => {
    const out = renderScoredSpec("x.md", specWithMultiTriggers, makeResult());
    expect(out).toContain("Triggered by bundles: healthcare, fintech");
  });

  it("(3) does NOT emit footer for spec with bundles: []", () => {
    const out = renderScoredSpec("x.md", specEmptyBundles, makeResult());
    expect(out).not.toContain("Enterprise Compliance Disclosure");
  });

  it("(4) does NOT emit footer when bundles field is absent", () => {
    const out = renderScoredSpec("x.md", specNoBundlesField, makeResult());
    expect(out).not.toContain("Enterprise Compliance Disclosure");
  });

  it("(5) does NOT emit footer when only non-trigger bundles are present", () => {
    const out = renderScoredSpec("x.md", specNonTriggerBundle, makeResult());
    expect(out).not.toContain("Enterprise Compliance Disclosure");
  });

  it("(6) emits footer case-insensitively (bundles: [Healthcare])", () => {
    const out = renderScoredSpec("x.md", specMixedCaseBundle, makeResult());
    expect(out).toContain("## Enterprise Compliance Disclosure");
    expect(out).toContain("Triggered by bundles: healthcare");
  });

  it("(7) emits footer for hyphen variant (financial-advisory → financial_advisory)", () => {
    const out = renderScoredSpec("x.md", specHyphenVariant, makeResult());
    expect(out).toContain("## Enterprise Compliance Disclosure");
    expect(out).toContain("Triggered by bundles: financial_advisory");
  });

  it("(8) footer text is verbatim-equal to docs/brand/enterprise-disclosure.md (drift detector)", () => {
    const docPath = resolve(__dirname, "../../docs/brand/enterprise-disclosure.md");
    const doc = readFileSync(docPath, "utf8");
    // Extract the canonical quoted disclosure: find the paragraph starting with
    // "**Dual-control disclosure.**" that appears inside a > blockquote
    // (per the canonical section in the brand doc).
    const canonicalMatch = doc.match(
      />\s*(\*\*Dual-control disclosure\.\*\*[^\n]+(?:\n>[^\n]*)*)/,
    );
    expect(
      canonicalMatch,
      "could not locate canonical disclosure paragraph in docs/brand/enterprise-disclosure.md",
    ).not.toBeNull();
    const docText = canonicalMatch![1]
      .split("\n")
      .map((line) => line.replace(/^>\s?/, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const implText = ENTERPRISE_DISCLOSURE_TEXT.replace(/\s+/g, " ").trim();
    expect(implText).toBe(docText);
  });

  it("(9) footer is appended AFTER the score block, not inside it", () => {
    const out = renderScoredSpec("x.md", specWithHealthcare, makeResult());
    const scoreIdx = out.indexOf("## ZAI Spec Score");
    const footerIdx = out.indexOf("## Enterprise Compliance Disclosure");
    expect(scoreIdx).toBeGreaterThan(-1);
    expect(footerIdx).toBeGreaterThan(-1);
    expect(footerIdx).toBeGreaterThan(scoreIdx);
  });
});

// ─── existing behavior preserved (regression guard) ───────────────────────

describe("renderScoredSpec — non-footer behavior preserved from buildScoredSpec", () => {
  it("renders original markdown, separator, and score block in that order", () => {
    const md = "# Title\n\n## Intent\nBody.\n";
    const out = renderScoredSpec("x.md", md, makeResult());
    expect(out.indexOf("# Title")).toBe(0);
    expect(out.indexOf("---")).toBeGreaterThan(0);
    expect(out.indexOf("## ZAI Spec Score")).toBeGreaterThan(out.indexOf("---"));
  });

  it("includes Pre-deploy gates section when gates present", () => {
    const md = "# Title\n";
    const out = renderScoredSpec(
      "x.md",
      md,
      makeResult({ gates: ["confirm chain status", "confirm accent color"] }),
    );
    expect(out).toContain("### Pre-deploy gates");
    expect(out).toContain("- [ ] confirm chain status");
  });

  it("omits Pre-deploy gates section when gates empty", () => {
    const md = "# Title\n";
    const out = renderScoredSpec("x.md", md, makeResult({ gates: [] }));
    expect(out).not.toContain("Pre-deploy gates");
  });

  it("includes _Source: filename_ line", () => {
    const md = "# Title\n";
    const out = renderScoredSpec(
      "2026-04-19__feat__example.md",
      md,
      makeResult(),
    );
    expect(out).toContain("_Source: 2026-04-19__feat__example.md_");
  });
});
