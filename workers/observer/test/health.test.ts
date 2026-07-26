import { describe, expect, it } from "vitest";
import app from "../src/index";

const testEnv = {
  APP_ENV: "test",
  HTU_ENV: "test",
  DB: {} as D1Database,
};

describe("GET /health", () => {
  it("returns 200 with a stable JSON payload identifying the Observer as healthy", async () => {
    const res = await app.request("/health", {}, testEnv);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      status: "ok",
      service: "zilin-observer",
      env: "test",
      version: "0.1.0",
    });
    expect(typeof body.timestamp).toBe("string");
  });
});

describe("unsupported routes", () => {
  it("returns a deterministic non-success response", async () => {
    const res = await app.request("/nope", {}, testEnv);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ status: "error", message: "not found" });
  });
});
