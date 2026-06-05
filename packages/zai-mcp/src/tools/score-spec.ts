import { scoreSpec, KNOWN_TYPES, type SpecType } from "../score-engine.js";
import { checkRateLimit, type RateLimitResult } from "../rate-limit.js";

const MAX_CONTENT_BYTES = 200 * 1024;

export const SCORE_SPEC_TOOL = {
  name: "score_spec",
  description:
    "Score a markdown spec against ZAI's rubric. Returns structured per-check pass/fail with error messages on failures. Read-only, stateless. Scores match zai.htu.io/app exactly.",
  inputSchema: {
    type: "object" as const,
    required: ["content", "type"],
    properties: {
      content: {
        type: "string" as const,
        description: "Raw markdown spec body. Must be ≤200KB.",
      },
      type: {
        type: "string" as const,
        enum: [...KNOWN_TYPES],
        description:
          "Spec type. One of: feat, bug, hotfix, spec, chore, refactor, research, ux, brand.",
      },
      bundles: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Optional bundle catalog tags (e.g., ['healthcare', 'fintech']). Reserved for future rubric bundles; ignored in v1.",
      },
    },
  },
} as const;

// Inputs are typed as optional `unknown` because they arrive from MCP
// callers as untrusted JSON. The handler validates each field at the top
// of the function; downstream consumers see narrowed types only after
// passing validation.
export type ScoreSpecInput = {
  content?: unknown;
  type?: unknown;
  bundles?: unknown;
};

export type ScoreSpecCheck = {
  name: string;
  pass: boolean;
  error?: string;
};

export type ScoreSpecOutput =
  | {
      score: number;
      max: number;
      passed: boolean;
      type: SpecType;
      rubric_version: string;
      checks: ScoreSpecCheck[];
    }
  | {
      error: "rate_limited";
      retry_after_seconds: number;
      remaining: RateLimitResult["remaining"];
    }
  | {
      error: "invalid_input" | "content_too_large" | "scoring_error";
      message: string;
    };

function isKnownType(value: unknown): value is SpecType {
  return typeof value === "string" && (KNOWN_TYPES as readonly string[]).includes(value);
}

function byteLength(s: string): number {
  // TextEncoder gives an accurate UTF-8 byte count and works in any modern
  // Node/runtime without requiring Buffer.
  return new TextEncoder().encode(s).length;
}

export function handleScoreSpec(
  input: ScoreSpecInput,
  rateLimitKey: string = "stdio"
): ScoreSpecOutput {
  // Rate limit first — over-limit must not even parse input. Cheaper for
  // hostile callers to be rejected before any work.
  const rl = checkRateLimit(rateLimitKey);
  if (!rl.allowed) {
    return {
      error: "rate_limited",
      retry_after_seconds: rl.retry_after_seconds ?? 1,
      remaining: rl.remaining,
    };
  }

  if (typeof input.content !== "string" || input.content.length === 0) {
    return { error: "invalid_input", message: "content must be a non-empty string" };
  }
  if (byteLength(input.content) > MAX_CONTENT_BYTES) {
    return {
      error: "content_too_large",
      message: `content exceeds maximum of ${MAX_CONTENT_BYTES} bytes`,
    };
  }
  if (!isKnownType(input.type)) {
    return {
      error: "invalid_input",
      message: `type must be one of: ${KNOWN_TYPES.join(", ")}`,
    };
  }

  // scoreSpec derives spec_type from filename. Synthesize a minimal valid
  // filename so the engine routes to the requested type without modifying
  // the existing zai/src/lib/scoreSpec.ts.
  const synthFilename = `2026-01-01__${input.type}__mcp-call.md`;

  let result;
  try {
    result = scoreSpec(input.content, synthFilename);
  } catch (e) {
    return {
      error: "scoring_error",
      message: e instanceof Error ? e.message : String(e),
    };
  }

  const checks: ScoreSpecCheck[] = result.section_order.map((key) => {
    const status = result.sections[key];
    const reason = result.section_reasons[key];
    return {
      name: result.section_labels[key] ?? key,
      pass: status === "PASS" || status === "SKIP",
      error: status === "FAIL" && reason ? reason : undefined,
    };
  });

  const score =
    result.section_order.filter(
      (k) => result.sections[k] === "PASS" || result.sections[k] === "SKIP"
    ).length;

  return {
    score,
    max: result.required_count,
    passed: result.passed,
    type: result.spec_type,
    rubric_version: result.rubric_version,
    checks,
  };
}
