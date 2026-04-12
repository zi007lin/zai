import { Hono } from "hono";

type Env = {
  APP_ENV: string;
  APP_URL: string;
  HTU_ENV: string;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
};

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    service: "zai",
    env: c.env.APP_ENV,
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  })
);

app.get("/api/env", (c) =>
  c.json({ env: c.env.APP_ENV, url: c.env.APP_URL, htu_env: c.env.HTU_ENV })
);

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
