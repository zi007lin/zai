import { describe, expect, it } from "vitest";
import { RUBRIC_SECTION_KEYS, scoreSpecWithType } from "./scoreSpec";
import {
  TEMPLATE_TYPES,
  getSpecTemplate,
  templateFilename,
  templateSectionKeys,
} from "./specTemplate";

function complete(template: string): string {
  return template
    .replaceAll(/<!--[^]*?-->/g, "Substantive requirement with a verified implementation outcome")
    .replaceAll("| Implementation | Substantive requirement with a verified implementation outcome |", "| Implementation | 60 minutes |")
    .replaceAll("| Review and deployment | Substantive requirement with a verified implementation outcome |", "| Review and deployment | 1 day |")
    .replaceAll("| Total | Substantive requirement with a verified implementation outcome |", "| Total | 60 minutes |")
    .replaceAll("| Implementation | Substantive requirement with a verified implementation outcome | TBD | TBD |", "| Implementation | 60 minutes | TBD | TBD |")
    .replaceAll("| Total | Substantive requirement with a verified implementation outcome | TBD | TBD |", "| Total | 60 minutes | TBD | TBD |");
}

describe("canonical spec templates", () => {
  it.each(TEMPLATE_TYPES)("keeps %s sections synchronized with its rubric", (type) => {
    expect(templateSectionKeys(type)).toEqual(RUBRIC_SECTION_KEYS[type]);
  });

  it.each(TEMPLATE_TYPES)("produces a completable %s template that passes", (type) => {
    const result = scoreSpecWithType(complete(getSpecTemplate(type)), type);
    expect(result.score).toBe(`${RUBRIC_SECTION_KEYS[type].length}/${RUBRIC_SECTION_KEYS[type].length}`);
    expect(result.passed, result.section_reasons).toBe(true);
  });

  it("uses canonical type-detectable filenames and H1s", () => {
    expect(templateFilename("feat")).toBe("YYYY-MM-DD__feat__short-title.md");
    expect(getSpecTemplate("bug")).toMatch(/^# YYYY-MM-DD__bug__short-title\.md$/m);
  });
});
