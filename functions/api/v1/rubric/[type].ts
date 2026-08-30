// GET /api/v1/rubric/:type (BUG #124). Previously undeclared in `functions/`,
// so requests fell through Cloudflare Pages routing to `public/_redirects`
// (`/* /index.html 200`) and returned the SPA HTML shell instead of the
// documented rubric JSON. Declaring this route gives it precedence over the
// `_redirects` catch-all. Logic lives in `src/lib/rubricApi.ts` so it can be
// unit-tested directly.
import { getRubricPayload } from "../../../../src/lib/rubricApi";

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
};

export const onRequestGet: PagesFunction = async ({ params }) => {
  const raw = params.type;
  const type = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const result = getRubricPayload(String(type));
  return new Response(JSON.stringify(result.body, null, 2), {
    status: result.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
