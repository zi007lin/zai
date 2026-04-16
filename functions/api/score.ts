interface Env {
  SCORE_ANALYTICS?: AnalyticsEngineDataset;
}

interface ScoreEvent {
  section: string;
  status: string;
  reason: string | null;
  spec_type: string;
  rubric_version: string;
}

interface ScoreLogRequest {
  rubric_version: string;
  spec_type: string;
  events: ScoreEvent[];
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

  let body: ScoreLogRequest;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: cors });
  }

  if (!body.events || !Array.isArray(body.events)) {
    return new Response('events[] required', { status: 400, headers: cors });
  }

  if (env.SCORE_ANALYTICS) {
    for (const event of body.events) {
      env.SCORE_ANALYTICS.writeDataPoint({
        blobs: [
          event.section,
          event.status,
          event.reason ?? '',
          event.spec_type,
          event.rubric_version,
        ],
        indexes: [event.spec_type],
      });
    }
  }

  return new Response(
    JSON.stringify({ ok: true, logged: body.events.length }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
  );
};
