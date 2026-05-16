// Spec-type detection with a fallback chain. Used by the web UI to score
// authentic ZiLin-Methodology specs even when their filenames are not
// canonical. The detector tries three sources in order:
//
//   1. filename — `YYYY-MM-DD__<type>__<title>(-vN)?(\.scored)?\.md`
//   2. H1       — `# FEAT: …`, `# BUG: …`, etc. (case-insensitive)
//   3. frontmatter — YAML `spec_type: <type>`
//
// When all three fail, throws `SpecTypeError` with a remediation message
// that tells the author how to fix it. The web UI catches that and renders
// an in-UI error banner; it must not propagate as `Uncaught (in promise)`.

export type SpecType =
  | "feat"
  | "bug"
  | "hotfix"
  | "spec"
  | "chore"
  | "refactor"
  | "research"
  | "ux"
  | "brand"
  | "epic";

export type DetectionSource = "filename" | "h1" | "frontmatter" | "manual";

export interface DetectionResult {
  type: SpecType;
  source: DetectionSource;
}

// Manual resolution path. Used when the auto-detect chain has exhausted
// (filename / H1 / frontmatter all miss) and the operator picks a type
// from the TypeSelector. Carries `source: 'manual'` so downstream
// readers can distinguish user-asserted type from inferred type.
export function resolveManual(type: SpecType): DetectionResult {
  return { type, source: "manual" };
}

// Full validation set. Every type the rubric scores against. Used for
// filename token validation; a canonical `2026-04-13__hotfix__urgent.md`
// keeps scoring through HOTFIX_SECTIONS even though `hotfix` is not in
// the canonical author-facing vocabulary surfaced in UI strings.
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
  "epic",
];

// Canonical author-facing vocabulary per ZAI methodology and rubric
// v1.5.0. The seven types authors create day-to-day; what the
// TypeSelector exposes and what user-visible error messages list as
// suggested types. Diverges from KNOWN_TYPES on purpose: `hotfix` and
// `research` are still scored (so existing canonical files keep
// working) but no longer surfaced to users because the methodology has
// folded them into one of the seven; `epic` is reserved for cross-phase
// tracking issues and is not a day-to-day author choice.
export const CANONICAL_USER_TYPES: readonly SpecType[] = [
  "feat",
  "bug",
  "spec",
  "chore",
  "refactor",
  "ux",
  "brand",
];

export class SpecTypeError extends Error {
  constructor(message: string);
  constructor(raw: string, known: readonly string[]);
  constructor(arg1: string, arg2?: readonly string[]) {
    if (arg2 !== undefined) {
      super(
        `Unknown spec type "${arg1}". Known: ${arg2.join(", ")}. Rename the file or add the type to ZAI_SYSTEM_INSTRUCTIONS.md.`,
      );
    } else {
      super(arg1);
    }
    this.name = "SpecTypeError";
  }
}

function normaliseRaw(raw: string): SpecType | null {
  const lower = raw.toLowerCase();
  if (lower === "feature") return "feat";
  if ((KNOWN_TYPES as readonly string[]).includes(lower)) return lower as SpecType;
  return null;
}

// Filename-only detector. Throws `SpecTypeError` on miss. Preserved as the
// primary path; callers that already have a canonical `.scored.md` filename
// hit this branch and skip the fallback chain.
export function detectSpecType(filename: string): SpecType {
  const basename = filename.split(/[\\/]/).pop() || filename;
  const match = basename.match(/^\d{4}-\d{2}-\d{2}__(\w+)__/);
  if (!match) {
    throw new SpecTypeError(
      `(no type prefix in filename "${basename}")`,
      CANONICAL_USER_TYPES,
    );
  }
  const normalised = normaliseRaw(match[1]);
  if (!normalised)
    throw new SpecTypeError(match[1].toLowerCase(), CANONICAL_USER_TYPES);
  return normalised;
}

// H1 fallback. Matches `# FEAT: …`, `# Feature: …`, `# BUG —`, etc. The
// type token must be the first word on the H1 line; whatever follows the
// type token must be a colon, em dash, or whitespace so that `# featured`
// (a real word starting with `feat`) does not match. Case-insensitive.
const H1_TYPE_TOKENS = [
  "feat",
  "feature",
  "bug",
  "hotfix",
  "spec",
  "chore",
  "refactor",
  "research",
  "ux",
  "brand",
  "epic",
] as const;

const H1_RE = new RegExp(
  `^#\\s+(${H1_TYPE_TOKENS.join("|")})(?=[:\\s\\u2014\\u2013\\-])`,
  "im",
);

function detectFromH1(content: string): SpecType | null {
  const m = content.match(H1_RE);
  if (!m) return null;
  return normaliseRaw(m[1]);
}

// Frontmatter fallback. Reads the first `---`-delimited block and looks
// for `spec_type: <type>`. The block must start on the first non-empty
// line; trailing content after the closing `---` is ignored.
const FRONTMATTER_RE = /^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/;
const FRONTMATTER_SPEC_TYPE_RE = /^\s*spec_type\s*:\s*["']?([A-Za-z]+)["']?\s*$/m;

function detectFromFrontmatter(content: string): SpecType | null {
  const fmMatch = content.match(FRONTMATTER_RE);
  if (!fmMatch) return null;
  const stMatch = fmMatch[1].match(FRONTMATTER_SPEC_TYPE_RE);
  if (!stMatch) return null;
  return normaliseRaw(stMatch[1]);
}

const UNRESOLVABLE_MESSAGE =
  "Could not infer spec type from filename, H1, or frontmatter. " +
  "Rename the file with a YYYY-MM-DD__<type>__ prefix, add an H1 like " +
  "`# FEAT: …`, or set `spec_type: <type>` in YAML frontmatter. " +
  `Known types: ${CANONICAL_USER_TYPES.join(", ")}.`;

// Full detector with H1 + frontmatter fallbacks. Always returns the source
// that resolved the type so the UI can label provenance ("inferred from H1").
export function detectSpecTypeWithFallback(
  filename: string,
  content: string,
): DetectionResult {
  try {
    const type = detectSpecType(filename);
    return { type, source: "filename" };
  } catch (err) {
    if (!(err instanceof SpecTypeError)) throw err;
  }
  const h1 = detectFromH1(content);
  if (h1) return { type: h1, source: "h1" };
  const fm = detectFromFrontmatter(content);
  if (fm) return { type: fm, source: "frontmatter" };
  throw new SpecTypeError(UNRESOLVABLE_MESSAGE);
}
