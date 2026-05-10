/**
 * src/lib/runImplCommit.ts
 *
 * Shared logic for Run Impl + File Issue (BUG #86). Closes the audit-
 * trail invariant gap: the SPA's "Run Impl" path used to call only the
 * GitHub Issues API, leaving `issues/<filename>.scored.md` uncommitted
 * on the target repo. This module wraps the issue-create call with a
 * preceding Contents-API commit so both succeed together or neither
 * does.
 *
 * Atomicity contract:
 *   - Dedupe (open issue with same title + label) → return early; no
 *     commit and no create. Matches pre-bug behavior; retroactive fixup
 *     of issues filed pre-#86 is tracked in a separate CHORE per spec
 *     Layer 2.
 *   - Commit MUST succeed before issue create runs. On commit failure
 *     (4xx/5xx/network), the function throws RunImplError and no issue
 *     is created. Worse failure mode is "nothing filed" (user retries),
 *     better than "issue filed without file" (silent corruption — the
 *     bug this PR fixes).
 *   - On issue-create failure after a successful commit, the function
 *     throws — file is left committed (git history is append-only;
 *     rollback would just add another commit and is more confusing
 *     than helpful).
 *
 * The handler in functions/api/issue.ts is a thin wrapper around
 * `runImplCommit`. Tests live at src/lib/runImplCommit.test.ts and
 * exercise this module directly with stubbed fetch.
 */

export interface RunImplCommitArgs {
  /** GitHub repo, `owner/repo`. */
  repo: string;
  /**
   * Spec filename as the SPA holds it (with or without `.md`,
   * with or without an `issues/` prefix). Normalized via
   * `buildScoredPath` to `issues/<base>.scored.md`.
   */
  filename: string;
  /** Issue title; also used in the dedupe lookup. */
  title: string;
  /**
   * Rendered `.scored.md` body. Used as both the committed file
   * contents AND the GitHub issue body so AC #3 (byte-for-byte match)
   * holds without any post-processing.
   */
  body: string;
  /** Single label applied to the issue (and consulted for dedupe). */
  label: string;
  /** GitHub API token with `contents:write` + `issues:write` on `repo`. */
  token: string;
  /** Default branch on `repo`. Defaults to `main`. */
  branch?: string;
}

export interface RunImplCommitResult {
  issue: {
    number: number;
    html_url: string;
    deduped: boolean;
  };
  commit: {
    sha: string;
    path: string;
    /** True when dedupe short-circuited and we did NOT commit. */
    deduped: boolean;
  };
}

export type FetchImpl = typeof fetch;

export class RunImplError extends Error {
  /** Step at which the failure occurred — used for log routing + UX copy. */
  step: "dedupe" | "commit" | "issue_create";
  /** HTTP status when applicable; undefined for network/parse errors. */
  status?: number;
  constructor(
    step: "dedupe" | "commit" | "issue_create",
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = "RunImplError";
    this.step = step;
    this.status = status;
  }
}

const GH_BASE = "https://api.github.com";

const SCORED_EXT_RE = /\.scored\.md$/i;
const MD_EXT_RE = /\.md$/i;
const ISSUES_PREFIX_RE = /^issues\//;

/**
 * Normalize an SPA-side filename to the canonical
 * `issues/<base>.scored.md` repo-relative path. Idempotent over the
 * shapes the SPA emits today (`<base>.md`, `<base>.scored.md`,
 * `issues/<base>.md`, etc.).
 */
export function buildScoredPath(filename: string): string {
  const base = filename
    .replace(ISSUES_PREFIX_RE, "")
    .replace(SCORED_EXT_RE, "")
    .replace(MD_EXT_RE, "");
  return `issues/${base}.scored.md`;
}

/**
 * UTF-8-safe base64 encoder. `btoa` alone breaks on non-Latin1 input
 * (em-dash, smart quotes, CJK). Cloudflare Pages Functions expose
 * `TextEncoder` and `btoa` natively, so no Node-side `Buffer`.
 */
export function utf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Standard headers for every GitHub API call this module makes.
 * `Bearer` (not the legacy `token` form) per current GH guidance;
 * pinned API version stops a future GH default flip from breaking us
 * silently.
 */
function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "zai-pages-fn",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

interface GitHubIssue {
  number: number;
  html_url: string;
  title: string;
}

interface GitHubCommitResponse {
  commit: { sha: string };
  content?: { sha: string; path: string };
}

/**
 * Three-step pipeline: dedupe → commit → create. Atomicity:
 *
 *   - dedupe match  → return (commit skipped on purpose)
 *   - commit fails  → throw; no issue created
 *   - create fails  → throw with `step: "issue_create"`; commit is
 *                     left in place (git is append-only)
 */
export async function runImplCommit(
  args: RunImplCommitArgs,
  fetchImpl: FetchImpl = globalThis.fetch,
): Promise<RunImplCommitResult> {
  const branch = args.branch ?? "main";
  const path = buildScoredPath(args.filename);
  const headers = ghHeaders(args.token);

  // 1. Dedupe: open issue with same title under the same label?
  const dedupeUrl =
    `${GH_BASE}/repos/${args.repo}/issues` +
    `?state=open&labels=${encodeURIComponent(args.label)}&per_page=50`;
  const dedupeRes = await fetchImpl(dedupeUrl, { headers });
  if (dedupeRes.ok) {
    const list = (await dedupeRes.json()) as GitHubIssue[];
    const match = list.find((i) => i.title === args.title);
    if (match) {
      // Pre-#86 behavior preserved: do NOT commit on dedupe hit. If
      // the existing issue was filed pre-fix and is missing its file,
      // a separate retroactive CHORE handles backfill.
      return {
        issue: {
          number: match.number,
          html_url: match.html_url,
          deduped: true,
        },
        commit: { sha: "", path, deduped: true },
      };
    }
  }
  // Dedupe lookup failures (5xx, network) are non-fatal — the dedupe
  // is a courtesy, not a correctness gate. We proceed to the commit
  // step rather than blocking the whole flow on a list-issues blip.

  // 2. Commit. Atomicity: must succeed before issue create runs.
  const commitUrl = `${GH_BASE}/repos/${args.repo}/contents/${path}`;
  const commitRes = await fetchImpl(commitUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `chore: archive scored spec ${path}`,
      content: utf8ToBase64(args.body),
      branch,
    }),
  });
  if (!commitRes.ok) {
    const text = await safeText(commitRes);
    throw new RunImplError(
      "commit",
      `commit_failed (${commitRes.status}): ${text}`,
      commitRes.status,
    );
  }
  const commitJson = (await commitRes.json()) as GitHubCommitResponse;
  const commitSha = commitJson.commit.sha;
  // Two distinct tail-friendly log lines (AC #6).
  console.log(`[runImpl] committed ${path} at sha=${commitSha}`);

  // 3. Issue create.
  const createUrl = `${GH_BASE}/repos/${args.repo}/issues`;
  const createRes = await fetchImpl(createUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: args.title,
      body: args.body,
      labels: [args.label],
    }),
  });
  if (!createRes.ok) {
    const text = await safeText(createRes);
    throw new RunImplError(
      "issue_create",
      `issue_create_failed_after_commit (${createRes.status}): ${text}`,
      createRes.status,
    );
  }
  const issue = (await createRes.json()) as GitHubIssue;
  console.log(`[runImpl] created issue #${issue.number} in ${args.repo}`);

  return {
    issue: {
      number: issue.number,
      html_url: issue.html_url,
      deduped: false,
    },
    commit: { sha: commitSha, path, deduped: false },
  };
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "(no body)";
  }
}
