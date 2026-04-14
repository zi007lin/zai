interface Env {
  ZZV_DISPATCH_TOKEN: string;
}

interface ImplRequest {
  issue_number: number;
  repo?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const auth = request.headers.get('Authorization');
  if (!auth || auth !== `Bearer ${env.ZZV_DISPATCH_TOKEN}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: ImplRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body.issue_number) {
    return new Response('issue_number required', { status: 400 });
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
    return new Response(`GitHub API error: ${text}`, { status: 502 });
  }

  return new Response(
    JSON.stringify({ ok: true, issue_number: body.issue_number, repo }),
    { status: 202, headers: { 'Content-Type': 'application/json' } }
  );
};
