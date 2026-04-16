interface Env {
  ZZV_DISPATCH_TOKEN: string;
}

interface IssueRequest {
  title: string;
  body: string;
  label: string;
  repo?: string;
}

interface GitHubIssue {
  number: number;
  html_url: string;
  title: string;
}

const ALLOWED_ORIGINS = new Set([
  'https://zai.htu.io',
  'https://demo.zai.htu.io',
  'https://dev.zai.htu.io',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
]);

function originAllowed(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export const onRequestOptions: PagesFunction<Env> = async ({ request }) => {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const cors = corsHeaders(request);

  if (!originAllowed(request)) {
    return new Response('Forbidden origin', { status: 403, headers: cors });
  }

  let body: IssueRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  if (!body.title || !body.body || !body.label) {
    return new Response('title, body, label required', { status: 400, headers: cors });
  }

  const repo = body.repo ?? 'zi007lin/zai';

  const ghHeaders: Record<string, string> = {
    'Authorization': `Bearer ${env.ZZV_DISPATCH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'zai-pages-fn',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Dedupe: look for existing open issue with same title under the same label
  const dedupeUrl =
    `https://api.github.com/repos/${repo}/issues` +
    `?state=open&labels=${encodeURIComponent(body.label)}&per_page=50`;
  const dedupeRes = await fetch(dedupeUrl, { headers: ghHeaders });
  if (dedupeRes.ok) {
    const list = (await dedupeRes.json()) as GitHubIssue[];
    const match = list.find((i) => i.title === body.title);
    if (match) {
      return new Response(
        JSON.stringify({
          issue_number: match.number,
          url: match.html_url,
          deduped: true,
        }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }

  const createRes = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: ghHeaders,
    body: JSON.stringify({
      title: body.title,
      body: body.body,
      labels: [body.label],
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    return new Response(`GitHub API error: ${text}`, { status: 502, headers: cors });
  }

  const issue = (await createRes.json()) as GitHubIssue;
  return new Response(
    JSON.stringify({
      issue_number: issue.number,
      url: issue.html_url,
      deduped: false,
    }),
    { status: 201, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
};
