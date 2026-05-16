import { describe, it, expect } from "vitest";
import { parseRepoHeader } from "./parseRepoHeader";

describe("parseRepoHeader", () => {
  it("returns the owner/repo token when **Repo:** line is present", () => {
    const md = "# Title\n\n**Repo:** zi007lin/zai\n\n## Intent\nx";
    expect(parseRepoHeader(md)).toBe("zi007lin/zai");
  });

  it("tolerates surrounding whitespace and backticks before the token", () => {
    const md = "**Repo:**   `zi007lin/zai`\n";
    expect(parseRepoHeader(md)).toBe("zi007lin/zai");
  });

  it("accepts dots, hyphens, and underscores in owner and repo", () => {
    const md = "**Repo:** my-org_1.0/my.repo-name_v2\n";
    expect(parseRepoHeader(md)).toBe("my-org_1.0/my.repo-name_v2");
  });

  it("returns the first match when multiple **Repo:** lines exist", () => {
    const md = "**Repo:** zi007lin/zai\n\nlater: **Repo:** other/repo\n";
    expect(parseRepoHeader(md)).toBe("zi007lin/zai");
  });

  it("returns null when **Repo:** line is absent", () => {
    const md = "# Title\n\n## Intent\nNo header here.\n";
    expect(parseRepoHeader(md)).toBeNull();
  });

  it("returns null when **Repo:** marker exists but no owner/repo token follows", () => {
    const md = "**Repo:** missing-slash\n";
    expect(parseRepoHeader(md)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseRepoHeader("")).toBeNull();
  });
});
