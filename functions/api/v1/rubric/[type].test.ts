import { describe, it, expect } from "vitest";
import { onRequestGet } from "./[type]";
import { RUBRIC_SECTION_KEYS, RUBRIC_VERSION } from "../../../../src/lib/scoreSpec";

// Guards the exact regression in BUG #124: `GET /api/v1/rubric/bug` fell
// through Cloudflare Pages routing to `public/_redirects`'s `/* /index.html
// 200` catch-all and returned the SPA HTML shell instead of rubric JSON,
// because no function was declared at this path. This test calls the
// handler directly and asserts it returns real JSON describing the live
// rubric — the thing the SPA shell could never do.
function context(type: string) {
  return { params: { type } } as unknown as Parameters<typeof onRequestGet>[0];
}

describe("GET /api/v1/rubric/:type", () => {
  it("returns JSON (not HTML) describing the live BUG rubric and rubric_version", async () => {
    const res = await onRequestGet(context("bug"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = await res.json();
    expect(body.rubric_version).toBe(RUBRIC_VERSION);
    expect(body.spec_type).toBe("bug");
    expect(body.required_count).toBe(8);
    expect(body.checks.map((c: { key: string }) => c.key)).toEqual(RUBRIC_SECTION_KEYS.bug);
  });

  it("returns 404 JSON for an unknown type instead of falling through to a shell", async () => {
    const res = await onRequestGet(context("not-a-type"));
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    const body = await res.json();
    expect(body.error).toMatch(/not-a-type/);
  });
});
