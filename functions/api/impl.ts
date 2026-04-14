interface Env {
  ZZV_DISPATCH_TOKEN: string;
}

interface ImplRequest {
  issue_number: number;
  repo?: string;
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

  let body: ImplRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  if (!body.issue_number) {
    return new Response('issue_number required', { status: 400, headers: cors });
  }

  const repo = body.repo ?? 'zi007lin/streettt-private';

  const response = await fetch(
    `https://api.github.com/repos/${repo}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ZZV_DISPATCH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'zai-pages-fn',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        event_type: 'zilin_impl',
        client_payload: {
          issue_number: body.issue_number,
          repo,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return new Response(`GitHub API error: ${text}`, { status: 502, headers: cors });
  }

  return new Response(
    JSON.stringify({ ok: true, issue_number: body.issue_number, repo }),
    { status: 202, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
};
