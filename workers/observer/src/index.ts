import { Hono } from "hono";

type Env = {
  APP_ENV: string;
  HTU_ENV: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "zilin-observer",
    env: c.env.APP_ENV,
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  })
);

app.notFound((c) =>
  c.json({ status: "error", message: "not found" }, 404)
);

export default app;
