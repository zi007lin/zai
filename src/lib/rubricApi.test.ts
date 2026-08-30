import { describe, it, expect } from "vitest";
import { getRubricPayload } from "./rubricApi";
import { RUBRIC_SECTION_KEYS, RUBRIC_VERSION, INTENT_CAPS } from "./scoreSpec";
import { KNOWN_TYPES } from "./specTypeDetector";

describe("getRubricPayload", () => {
  it("returns the live BUG rubric contract, not the SPA shell (BUG #124)", () => {
    const result = getRubricPayload("bug");
    expect(result.status).toBe(200);
    if (result.status !== 200) throw new Error("unreachable");
    expect(result.body.rubric_version).toBe(RUBRIC_VERSION);
    expect(result.body.spec_type).toBe("bug");
    expect(result.body.required_count).toBe(8);
    expect(result.body.checks.map((c) => c.key)).toEqual(RUBRIC_SECTION_KEYS.bug);
    expect(result.body.checks.map((c) => c.key)).toContain("work_estimate");
  });

  it("is case-insensitive and trims whitespace", () => {
    const result = getRubricPayload("  BUG  ");
    expect(result.status).toBe(200);
    if (result.status !== 200) throw new Error("unreachable");
    expect(result.body.spec_type).toBe("bug");
  });

  it("returns 404 with known_types for an unrecognized type", () => {
    const result = getRubricPayload("not-a-type");
    expect(result.status).toBe(404);
    if (result.status !== 404) throw new Error("unreachable");
    expect(result.body.error).toMatch(/not-a-type/);
    expect(result.body.known_types).toEqual(KNOWN_TYPES);
  });

  it.each(KNOWN_TYPES)("returns a matching contract for every known type: %s", (type) => {
    const result = getRubricPayload(type);
    expect(result.status).toBe(200);
    if (result.status !== 200) throw new Error("unreachable");
    expect(result.body.required_count).toBe(RUBRIC_SECTION_KEYS[type].length);
    expect(result.body.intent_word_cap).toBe(INTENT_CAPS[type]);
  });
});
