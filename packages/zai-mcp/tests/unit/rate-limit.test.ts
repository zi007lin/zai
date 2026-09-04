import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimits } from "../../src/rate-limit.js";

describe("rate-limit", () => {
  beforeEach(() => {
    _resetRateLimits();
  });

  it("first call is allowed and returns full remaining capacity", () => {
    const r = checkRateLimit("k1");
    expect(r.allowed).toBe(true);
    expect(r.remaining.minute).toBe(29);
    expect(r.remaining.hour).toBe(199);
    expect(r.remaining.day).toBe(999);
  });

  it("blocks the 31st call within a minute", () => {
    const t = 1_000_000;
    for (let i = 0; i < 30; i++) {
      const r = checkRateLimit("k1", t + i);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit("k1", t + 30);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retry_after_seconds).toBeGreaterThan(0);
    expect(blocked.retry_after_seconds).toBeLessThanOrEqual(60);
  });

  it("recovers after the minute window passes", () => {
    const t = 2_000_000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("k2", t + i);
    }
    expect(checkRateLimit("k2", t + 30).allowed).toBe(false);
    // 60s later, the per-minute window has slid past all earlier entries.
    expect(checkRateLimit("k2", t + 60_001).allowed).toBe(true);
  });

  it("isolates keys", () => {
    const t = 3_000_000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("ka", t + i);
    }
    expect(checkRateLimit("ka", t + 30).allowed).toBe(false);
    // Different key still has full capacity.
    expect(checkRateLimit("kb", t + 30).allowed).toBe(true);
  });

  it("blocks when the hour cap is reached even if minute window allows", () => {
    const t = 4_000_000;
    // Spread 200 calls across the hour: 30 every 6 min + 20 in min 36.
    let cur = t;
    for (let i = 0; i < 200; i++) {
      // 200 calls over 60 minutes -> ~18s apart -> never trips minute cap.
      cur = t + i * 18_000;
      const r = checkRateLimit("kh", cur);
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit("kh", cur + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retry_after_seconds).toBeGreaterThan(0);
  });
});
