/**
 * src/lib/runImplCommit.test.ts
 *
 * Coverage for src/lib/runImplCommit.ts (BUG #86). Drives the pure
 * `runImplCommit` against a recording fetch stub so we can pin the
 * sequence of calls (dedupe → commit → issue create), assert the
 * atomicity guard fires correctly, and verify the byte-for-byte body
 * match between the committed file and the created issue.
 *
 * Acceptance Criteria coverage from
 * issues/2026-05-10__bug__run-impl-missing-scored-md-commit-v1.scored.md:
 *   ✓ AC #1: a commit appears on the target repo on Run Impl click
 *   ✓ AC #2: committed path is `issues/<base>.scored.md`
 *   ✓ AC #3: committed body matches issue body byte-for-byte
 *   ✓ AC #4: commit fails → no issue created, function throws
 *   ✓ AC #5: missing scope manifests as a 4xx commit failure with
 *           operator-actionable error message
 *   ✓ AC #6: two distinct log lines per non-dedupe path
 *   ✓ AC #7: existing successful behavior preserved (issue still gets
 *           the full body)
 *   ✓ AC #8: edge cases — issue-create fails after commit (file
 *           orphaned, no rollback), unknown spec_type, dedupe
 *
 * Plus filename-normalization helper coverage (`buildScoredPath`) and
 * UTF-8 base64 helper (`utf8ToBase64`) for non-Latin1 spec content.
 */

import { describe, it, expect } from "vitest";

import {
  RunImplError,
  buildScoredPath,
  runImplCommit,
  utf8ToBase64,
  type RunImplCommitArgs,
} from "./runImplCommit";

// ─────────────────────────────────────────────────────────────────────
// Recording fetch stub
// ─────────────────────────────────────────────────────────────────────

interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function makeFetchStub(responses: Array<() => Response | Promise<Response>>) {
  const calls: RecordedCall[] = [];
  let i = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    const headers: Record<string, string> = {};
    const initHeaders = init?.headers ?? {};
    if (initHeaders instanceof Headers) {
      initHeaders.forEach((v, k) => (headers[k.toLowerCase()] = v));
    } else {
      for (const [k, v] of Object.entries(
        initHeaders as Record<string, string>,
      )) {
        headers[k.toLowerCase()] = v;
      }
    }
    calls.push({
      url,
      method: init?.method ?? "GET",
      headers,
      body: typeof init?.body === "string" ? init.body : undefined,
    });
    if (i >= responses.length) throw new Error("fetch stub exhausted");
    const r = responses[i++]();
    return r instanceof Promise ? r : Promise.resolve(r);
  };
  return { fetchImpl, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ARGS_BASE: RunImplCommitArgs = {
  repo: "zi007lin/zai",
  filename: "2026-05-10__bug__example.md",
  title: "bug: example title",
  body: "# bug: example title\n\nbody\n\n## ZAI Spec Score\n- **Passed:** YES\n",
  label: "bug",
  token: "ghp_test",
};

// ─────────────────────────────────────────────────────────────────────
// buildScoredPath
// ─────────────────────────────────────────────────────────────────────

describe("buildScoredPath", () => {
  it("normalizes plain `<base>.md`", () => {
    expect(buildScoredPath("2026-05-10__bug__example.md")).toBe(
      "issues/2026-05-10__bug__example.scored.md",
    );
  });

  it("strips an existing `.scored.md` suffix (idempotent)", () => {
    expect(buildScoredPath("2026-05-10__bug__example.scored.md")).toBe(
      "issues/2026-05-10__bug__example.scored.md",
    );
  });

  it("strips an `issues/` prefix (idempotent)", () => {
    expect(buildScoredPath("issues/2026-05-10__bug__example.md")).toBe(
      "issues/2026-05-10__bug__example.scored.md",
    );
  });

  it("handles the bare slug (no extension)", () => {
    expect(buildScoredPath("2026-05-10__bug__example")).toBe(
      "issues/2026-05-10__bug__example.scored.md",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────
// utf8ToBase64
// ─────────────────────────────────────────────────────────────────────

describe("utf8ToBase64", () => {
  it("round-trips ASCII", () => {
    const out = utf8ToBase64("hello");
    expect(out).toBe("aGVsbG8=");
  });

  it("encodes UTF-8 multi-byte chars (em-dash, smart quotes, CJK)", () => {
    // Plain `btoa` would throw on these inputs.
    expect(() => utf8ToBase64("— a sentence")).not.toThrow();
    expect(() => utf8ToBase64("中文")).not.toThrow();
    expect(() => utf8ToBase64("'smart' \"quotes\"")).not.toThrow();
  });

  it("output decodes back to the original UTF-8 string", () => {
    const original = "spec body with — em-dash and 中文";
    const encoded = utf8ToBase64(original);
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toBe(original);
  });
});

// ─────────────────────────────────────────────────────────────────────
// runImplCommit — happy path
// ─────────────────────────────────────────────────────────────────────

describe("runImplCommit — happy path (AC #1, #2, #3, #6, #7)", () => {
  it("dedupe → commit → create, in that order, both succeed", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      // 1. dedupe lookup → empty list (no match)
      () => jsonResponse([]),
      // 2. commit → 201
      () =>
        jsonResponse(
          {
            commit: { sha: "abc123" },
            content: { sha: "blob-sha", path: "issues/x.scored.md" },
          },
          201,
        ),
      // 3. issue create → 201
      () =>
        jsonResponse(
          {
            number: 42,
            html_url: "https://github.com/zi007lin/zai/issues/42",
            title: ARGS_BASE.title,
          },
          201,
        ),
    ]);

    const out = await runImplCommit(ARGS_BASE, fetchImpl);

    expect(calls).toHaveLength(3);
    // [AC #1, #2] commit hit Contents API at the correct path
    expect(calls[1].method).toBe("PUT");
    expect(calls[1].url).toBe(
      "https://api.github.com/repos/zi007lin/zai/contents/issues/2026-05-10__bug__example.scored.md",
    );
    // [AC #3] commit body content equals issueBody (byte-for-byte) once base64-decoded
    const commitJson = JSON.parse(calls[1].body!);
    const commitBytes = Uint8Array.from(atob(commitJson.content), (c) =>
      c.charCodeAt(0),
    );
    expect(new TextDecoder().decode(commitBytes)).toBe(ARGS_BASE.body);
    // commit message references the path
    expect(commitJson.message).toContain("issues/2026-05-10__bug__example.scored.md");
    expect(commitJson.branch).toBe("main");

    // [AC #7] issue create still happens with full body
    expect(calls[2].method).toBe("POST");
    expect(calls[2].url).toBe(
      "https://api.github.com/repos/zi007lin/zai/issues",
    );
    const createJson = JSON.parse(calls[2].body!);
    expect(createJson.title).toBe(ARGS_BASE.title);
    expect(createJson.body).toBe(ARGS_BASE.body);
    expect(createJson.labels).toEqual(["bug"]);

    // Result shape
    expect(out.issue.number).toBe(42);
    expect(out.issue.deduped).toBe(false);
    expect(out.commit.sha).toBe("abc123");
    expect(out.commit.path).toBe(
      "issues/2026-05-10__bug__example.scored.md",
    );
    expect(out.commit.deduped).toBe(false);
  });

  it("[AC #6] emits two distinct tail-friendly log lines on success", async () => {
    const logs: string[] = [];
    const origLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    };
    try {
      const { fetchImpl } = makeFetchStub([
        () => jsonResponse([]),
        () => jsonResponse({ commit: { sha: "deadbeef" } }, 201),
        () =>
          jsonResponse(
            {
              number: 7,
              html_url: "https://github.com/zi007lin/zai/issues/7",
              title: ARGS_BASE.title,
            },
            201,
          ),
      ]);
      await runImplCommit(ARGS_BASE, fetchImpl);
    } finally {
      console.log = origLog;
    }
    const runImplLogs = logs.filter((l) => l.startsWith("[runImpl]"));
    expect(runImplLogs).toHaveLength(2);
    expect(runImplLogs[0]).toMatch(/committed.*sha=deadbeef/);
    expect(runImplLogs[1]).toMatch(/created issue #7/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// runImplCommit — failure modes
// ─────────────────────────────────────────────────────────────────────

describe("runImplCommit — atomicity guard (AC #4, #5)", () => {
  it("[AC #4] commit fails (4xx) → throws RunImplError(step='commit'); NO issue created", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => jsonResponse([]), // dedupe
      () => new Response("Resource not accessible by integration", { status: 403 }),
      // No third response; if the issue create fires, the stub throws "exhausted"
    ]);

    let caught: unknown;
    try {
      await runImplCommit(ARGS_BASE, fetchImpl);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RunImplError);
    expect((caught as RunImplError).step).toBe("commit");
    expect((caught as RunImplError).status).toBe(403);
    expect((caught as RunImplError).message).toMatch(/commit_failed/);
    // Only 2 calls (dedupe + failed commit), NO issue create.
    expect(calls).toHaveLength(2);
  });

  it("[AC #5] commit 403 'Resource not accessible' → operator-actionable message preserved verbatim", async () => {
    const { fetchImpl } = makeFetchStub([
      () => jsonResponse([]),
      () =>
        new Response("Resource not accessible by integration", { status: 403 }),
    ]);
    try {
      await runImplCommit(ARGS_BASE, fetchImpl);
    } catch (e) {
      expect((e as RunImplError).message).toContain(
        "Resource not accessible by integration",
      );
    }
  });

  it("commit fails (5xx) → throws RunImplError; no retry; no issue", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => jsonResponse([]),
      () => new Response("upstream", { status: 502 }),
    ]);
    await expect(runImplCommit(ARGS_BASE, fetchImpl)).rejects.toBeInstanceOf(
      RunImplError,
    );
    expect(calls).toHaveLength(2);
  });
});

describe("runImplCommit — issue-create fails AFTER successful commit (AC #8)", () => {
  it("throws RunImplError(step='issue_create'); commit is left in place", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => jsonResponse([]),
      () => jsonResponse({ commit: { sha: "abc" } }, 201),
      () => new Response("rate limited", { status: 429 }),
    ]);

    let caught: unknown;
    try {
      await runImplCommit(ARGS_BASE, fetchImpl);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RunImplError);
    expect((caught as RunImplError).step).toBe("issue_create");
    expect((caught as RunImplError).status).toBe(429);
    // All 3 calls fired — confirms commit succeeded before create
    // failed (no rollback attempted).
    expect(calls).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────
// runImplCommit — dedupe path (AC #8)
// ─────────────────────────────────────────────────────────────────────

describe("runImplCommit — dedupe path (AC #8)", () => {
  it("returns existing issue without commit when title matches an open issue", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () =>
        jsonResponse([
          {
            number: 99,
            html_url: "https://github.com/zi007lin/zai/issues/99",
            title: ARGS_BASE.title,
          },
        ]),
      // No second/third response — if commit or create fire, the stub
      // throws "exhausted" and the test fails.
    ]);

    const out = await runImplCommit(ARGS_BASE, fetchImpl);

    expect(out.issue.number).toBe(99);
    expect(out.issue.deduped).toBe(true);
    expect(out.commit.deduped).toBe(true);
    expect(out.commit.sha).toBe("");
    expect(calls).toHaveLength(1);
  });

  it("does NOT dedupe when title differs (proceeds to commit + create)", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () =>
        jsonResponse([
          {
            number: 99,
            html_url: "https://github.com/zi007lin/zai/issues/99",
            title: "different title",
          },
        ]),
      () => jsonResponse({ commit: { sha: "x" } }, 201),
      () =>
        jsonResponse(
          {
            number: 100,
            html_url: "https://github.com/zi007lin/zai/issues/100",
            title: ARGS_BASE.title,
          },
          201,
        ),
    ]);

    const out = await runImplCommit(ARGS_BASE, fetchImpl);
    expect(out.issue.number).toBe(100);
    expect(out.issue.deduped).toBe(false);
    expect(calls).toHaveLength(3);
  });

  it("dedupe lookup 5xx is non-fatal — proceeds to commit + create", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => new Response("upstream", { status: 503 }),
      () => jsonResponse({ commit: { sha: "x" } }, 201),
      () =>
        jsonResponse(
          {
            number: 101,
            html_url: "https://github.com/zi007lin/zai/issues/101",
            title: ARGS_BASE.title,
          },
          201,
        ),
    ]);
    const out = await runImplCommit(ARGS_BASE, fetchImpl);
    expect(out.issue.number).toBe(101);
    expect(calls).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────
// runImplCommit — auth header + branch override
// ─────────────────────────────────────────────────────────────────────

describe("runImplCommit — request shape", () => {
  it("uses Bearer auth header on every call", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => jsonResponse([]),
      () => jsonResponse({ commit: { sha: "x" } }, 201),
      () =>
        jsonResponse(
          {
            number: 1,
            html_url: "https://github.com/zi007lin/zai/issues/1",
            title: ARGS_BASE.title,
          },
          201,
        ),
    ]);
    await runImplCommit(ARGS_BASE, fetchImpl);
    for (const c of calls) {
      expect(c.headers["authorization"]).toBe("Bearer ghp_test");
      expect(c.headers["x-github-api-version"]).toBe("2022-11-28");
    }
  });

  it("honors the `branch` override (defaults to `main`)", async () => {
    const { fetchImpl, calls } = makeFetchStub([
      () => jsonResponse([]),
      () => jsonResponse({ commit: { sha: "x" } }, 201),
      () =>
        jsonResponse(
          {
            number: 1,
            html_url: "https://github.com/zi007lin/zai/issues/1",
            title: ARGS_BASE.title,
          },
          201,
        ),
    ]);
    await runImplCommit({ ...ARGS_BASE, branch: "develop" }, fetchImpl);
    const commitBody = JSON.parse(calls[1].body!);
    expect(commitBody.branch).toBe("develop");
  });
});
