import {
  RunImplError,
  runImplCommit,
  type RunImplCommitArgs,
} from "../../src/lib/runImplCommit";

interface Env {
  ZZV_DISPATCH_TOKEN: string;
}

interface IssueRequest {
  title: string;
  body: string;
  label: string;
  /**
   * Spec filename as the SPA holds it (e.g.
   * `2026-05-10__bug__example.md`). Required by BUG #86 — the handler
   * commits `issues/<base>.scored.md` to `repo` BEFORE creating the
   * issue. Older clients without this field receive a 400 so the
   * audit-trail invariant can't silently regress.
   */
  filename: string;
  repo?: string;
}

const ALLOWED_ORIGINS = new Set([
  "https://zai.htu.io",
  "https://demo.zai.htu.io",
  "https://dev.zai.htu.io",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
]);

function originAllowed(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cors = corsHeaders(request);

  if (!originAllowed(request)) {
    return new Response("Forbidden origin", { status: 403, headers: cors });
  }

  let body: IssueRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: cors });
  }

  if (!body.title || !body.body || !body.label) {
    return new Response("title, body, label required", {
      status: 400,
      headers: cors,
    });
  }
  if (!body.filename) {
    // BUG #86: filename is required. Returning 400 here makes a stale
    // SPA build fail loudly rather than silently dropping the commit
    // step.
    return new Response(
      "filename required (added by BUG #86 — stale SPA bundle? hard-refresh the tab)",
      { status: 400, headers: cors },
    );
  }

  const repo = body.repo ?? "zi007lin/zai";

  const args: RunImplCommitArgs = {
    repo,
    filename: body.filename,
    title: body.title,
    body: body.body,
    label: body.label,
    token: env.ZZV_DISPATCH_TOKEN,
  };

  try {
    const result = await runImplCommit(args);
    const status = result.issue.deduped ? 200 : 201;
    return new Response(
      JSON.stringify({
        issue_number: result.issue.number,
        url: result.issue.html_url,
        deduped: result.issue.deduped,
        committed_path: result.commit.deduped ? null : result.commit.path,
        committed_sha: result.commit.deduped ? null : result.commit.sha,
      }),
      { status, headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (err) {
    if (err instanceof RunImplError) {
      // Surface the failing step in the response so the SPA toast can
      // direct the user. `step: "commit"` typically means token scope
      // (`contents:write`); `step: "issue_create"` after a successful
      // commit means file is committed but issue create failed —
      // operator can manually file the issue from the committed body.
      const payload = {
        error: err.message,
        step: err.step,
        status: err.status ?? null,
        hint:
          err.step === "commit"
            ? "GitHub Contents API rejected the commit. Most common cause: ZZV_DISPATCH_TOKEN lacks contents:write on the target repo. Re-issue the token with the missing scope."
            : err.step === "issue_create"
              ? "Commit succeeded but issue create failed. The .scored.md file is on the repo; file the issue manually with the same body, or retry — dedupe will skip the duplicate file."
              : undefined,
      };
      return new Response(JSON.stringify(payload), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    throw err;
  }
};
