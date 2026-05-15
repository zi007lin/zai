import { describe, it, expect } from "vitest";
import {
  KNOWN_TYPES,
  SpecTypeError,
  detectSpecType,
  detectSpecTypeWithFallback,
  resolveManual,
} from "./specTypeDetector";
import { scoreSpecWithType } from "./scoreSpec";

// Fixture content covering the three resolution paths plus the
// unresolvable case. These mirror the test fixtures called out in
// the BUG spec (broken/fixed/frontmatter/unresolvable) but live
// inline so the detector tests have no filesystem dependency.

const BROKEN_FEAT_H1 = `# FEAT: Pre-trade compliance check API for derivative trades

## Intent
Some intent prose.
`;

const FIXED_FEAT_H1 = `# FEAT: Pre-trade compliance check API for derivative trades

## Intent
Some intent prose.

## Game Theory Cooperative Model review

### Who benefits
Authors who upload non-canonical filenames.

### Abuse vector
None.

### Mitigation
None.
`;

const FRONTMATTER_BUG = `---
spec_type: bug
title: A bug with no filename prefix and no H1 prefix
---

# Some unrelated H1 that does not start with a type token

## Repro
Steps.
`;

const UNRESOLVABLE = `# Random title with no recognised prefix

Some body text without a frontmatter block.
`;

describe("detectSpecType (filename only)", () => {
  it("returns the type from a canonical filename", () => {
    expect(detectSpecType("2026-04-13__feat__title.md")).toBe("feat");
    expect(detectSpecType("2026-04-13__bug__x.md")).toBe("bug");
  });

  it("normalises 'feature' to 'feat'", () => {
    expect(detectSpecType("2026-04-13__feature__x.md")).toBe("feat");
  });

  it("throws SpecTypeError on no prefix", () => {
    expect(() => detectSpecType("README.md")).toThrow(SpecTypeError);
  });

  it("throws SpecTypeError on unknown token", () => {
    expect(() => detectSpecType("2026-04-13__wat__x.md")).toThrow(SpecTypeError);
  });
});

describe("detectSpecTypeWithFallback", () => {
  it("resolves via filename when canonical (source: 'filename')", () => {
    const r = detectSpecTypeWithFallback(
      "2026-05-15__feat__title.md",
      BROKEN_FEAT_H1,
    );
    expect(r).toEqual({ type: "feat", source: "filename" });
  });

  it("resolves '.scored.md' re-uploads via filename", () => {
    const r = detectSpecTypeWithFallback(
      "2026-05-15__feat__title.scored.md",
      "",
    );
    expect(r).toEqual({ type: "feat", source: "filename" });
  });

  it("falls back to H1 when filename is non-canonical (source: 'h1')", () => {
    const r = detectSpecTypeWithFallback(
      "example-feat-broken.md",
      BROKEN_FEAT_H1,
    );
    expect(r).toEqual({ type: "feat", source: "h1" });
  });

  it("matches H1 case-insensitively and with em dash or colon", () => {
    expect(
      detectSpecTypeWithFallback("x.md", "# Bug: lowercase title\n").type,
    ).toBe("bug");
    expect(
      detectSpecTypeWithFallback("x.md", "# REFACTOR — em-dash title\n").type,
    ).toBe("refactor");
    expect(
      detectSpecTypeWithFallback("x.md", "# Feature: maps feature → feat\n").type,
    ).toBe("feat");
  });

  it("does not match unrelated words that share a prefix", () => {
    // "featured" starts with "feat" but is a real word; the lookahead
    // ensures only `feat:`, `feat ` or `feat —` count.
    expect(() =>
      detectSpecTypeWithFallback("x.md", "# Featured launch notes\n"),
    ).toThrow(SpecTypeError);
  });

  it("falls back to frontmatter when no filename or H1 hit (source: 'frontmatter')", () => {
    const r = detectSpecTypeWithFallback(
      "example-frontmatter-bug.md",
      FRONTMATTER_BUG,
    );
    expect(r).toEqual({ type: "bug", source: "frontmatter" });
  });

  it("frontmatter accepts quoted values", () => {
    const md = `---\nspec_type: "chore"\n---\n\nbody\n`;
    expect(detectSpecTypeWithFallback("x.md", md).type).toBe("chore");
  });

  it("frontmatter normalises 'feature' to 'feat'", () => {
    const md = `---\nspec_type: feature\n---\nbody\n`;
    expect(detectSpecTypeWithFallback("x.md", md).type).toBe("feat");
  });

  it("throws SpecTypeError with remediation when all three paths miss", () => {
    let caught: SpecTypeError | null = null;
    try {
      detectSpecTypeWithFallback("example-unresolvable.md", UNRESOLVABLE);
    } catch (err) {
      caught = err as SpecTypeError;
    }
    expect(caught).toBeInstanceOf(SpecTypeError);
    expect(caught!.message).toMatch(/Could not infer spec type/);
    expect(caught!.message).toMatch(/filename, H1, or frontmatter/);
    for (const t of KNOWN_TYPES) {
      expect(caught!.message).toContain(t);
    }
  });

  it("filename hit short-circuits H1 — even if both would resolve", () => {
    // Canonical filename says `bug`; body H1 says `feat`. Filename wins.
    const r = detectSpecTypeWithFallback(
      "2026-05-15__bug__x.md",
      "# FEAT: misleading H1\n",
    );
    expect(r).toEqual({ type: "bug", source: "filename" });
  });

  it("H1 hit short-circuits frontmatter — H1 wins when both present", () => {
    const md = `---\nspec_type: chore\n---\n\n# BUG: H1 says bug\n`;
    const r = detectSpecTypeWithFallback("x.md", md);
    expect(r).toEqual({ type: "bug", source: "h1" });
  });
});

describe("resolveManual + scoreSpecWithType", () => {
  it("resolveManual returns { type, source: 'manual' }", () => {
    expect(resolveManual("feat")).toEqual({ type: "feat", source: "manual" });
    expect(resolveManual("bug")).toEqual({ type: "bug", source: "manual" });
  });

  it("scoreSpecWithType bypasses the detector and records source 'manual'", () => {
    // Markdown deliberately starts with prose that the H1 / frontmatter
    // detectors would not match. If scoreSpecWithType were going through
    // the auto-detect chain it would throw SpecTypeError; instead it
    // honours the caller's chosen type.
    const md =
      "Random first line that is not an H1 with a type token.\n\n" +
      "## Intent\nSome intent prose.\n";
    const r = scoreSpecWithType(md, "chore");
    expect(r.spec_type).toBe("chore");
    expect(r.type_source).toBe("manual");
  });

  it("scoreSpecWithType honours the manually picked type even when filename and body would resolve differently", () => {
    const md = "# FEAT: body says feat\n\n## Intent\nprose\n";
    // Detector would say `feat`; caller asserts `bug`. Caller wins.
    const r = scoreSpecWithType(md, "bug");
    expect(r.spec_type).toBe("bug");
    expect(r.type_source).toBe("manual");
  });
});
