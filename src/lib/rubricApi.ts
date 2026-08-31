// Backs `GET /api/v1/rubric/:type` (BUG #124). Pure lookup — no request/
// response types here so it can be unit-tested directly and reused by the
// Pages Function at `functions/api/v1/rubric/[type].ts` without pulling in
// the Workers runtime types.
import {
  INTENT_CAPS,
  KNOWN_TYPES,
  RUBRIC_VERSION,
  SECTIONS_BY_TYPE,
  type SpecType,
} from "./scoreSpec";

export interface RubricCheck {
  key: string;
  label: string;
}

export interface RubricPayload {
  rubric_version: string;
  spec_type: SpecType;
  required_count: number;
  intent_word_cap: number;
  checks: RubricCheck[];
}

export interface RubricNotFound {
  error: string;
  known_types: readonly SpecType[];
}

export type RubricLookup =
  | { status: 200; body: RubricPayload }
  | { status: 404; body: RubricNotFound };

export function getRubricPayload(rawType: string): RubricLookup {
  const type = rawType.trim().toLowerCase();
  if (!(KNOWN_TYPES as readonly string[]).includes(type)) {
    return {
      status: 404,
      body: {
        error: `unknown spec type "${rawType}"`,
        known_types: KNOWN_TYPES,
      },
    };
  }
  const specType = type as SpecType;
  const defs = SECTIONS_BY_TYPE[specType];
  return {
    status: 200,
    body: {
      rubric_version: RUBRIC_VERSION,
      spec_type: specType,
      required_count: defs.length,
      intent_word_cap: INTENT_CAPS[specType],
      checks: defs.map((d) => ({ key: d.key, label: d.label })),
    },
  };
}
