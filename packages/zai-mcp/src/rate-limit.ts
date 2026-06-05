// In-memory sliding-window rate limiter, three caps per key.
// Keyed per-IP when client metadata exposes one; falls back to a single
// "stdio" key for stdio transport (per-process limit).

export interface RateLimitResult {
  allowed: boolean;
  retry_after_seconds?: number;
  remaining: { minute: number; hour: number; day: number };
}

const LIMITS = {
  minute: { count: 30, window_ms: 60_000 },
  hour: { count: 200, window_ms: 3_600_000 },
  day: { count: 1000, window_ms: 86_400_000 },
} as const;

interface Window {
  per_minute: number[];
  per_hour: number[];
  per_day: number[];
}

const windows = new Map<string, Window>();

function getWindow(key: string): Window {
  let w = windows.get(key);
  if (!w) {
    w = { per_minute: [], per_hour: [], per_day: [] };
    windows.set(key, w);
  }
  return w;
}

function prune(arr: number[], windowMs: number, now: number): number[] {
  // Linear scan; keep timestamps within the window. Acceptable for our
  // bounded counts (max 1000 entries per day per key).
  const cutoff = now - windowMs;
  const kept: number[] = [];
  for (const t of arr) {
    if (t > cutoff) kept.push(t);
  }
  return kept;
}

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const w = getWindow(key);
  w.per_minute = prune(w.per_minute, LIMITS.minute.window_ms, now);
  w.per_hour = prune(w.per_hour, LIMITS.hour.window_ms, now);
  w.per_day = prune(w.per_day, LIMITS.day.window_ms, now);

  const overMinute = w.per_minute.length >= LIMITS.minute.count;
  const overHour = w.per_hour.length >= LIMITS.hour.count;
  const overDay = w.per_day.length >= LIMITS.day.count;

  if (overMinute || overHour || overDay) {
    // Pick the tightest limit and compute retry_after from its oldest entry.
    const tightest = overMinute
      ? { arr: w.per_minute, window_ms: LIMITS.minute.window_ms }
      : overHour
      ? { arr: w.per_hour, window_ms: LIMITS.hour.window_ms }
      : { arr: w.per_day, window_ms: LIMITS.day.window_ms };
    const oldest = tightest.arr[0] ?? now;
    const retry_after_seconds = Math.max(
      1,
      Math.ceil((tightest.window_ms - (now - oldest)) / 1000)
    );
    return {
      allowed: false,
      retry_after_seconds,
      remaining: {
        minute: Math.max(0, LIMITS.minute.count - w.per_minute.length),
        hour: Math.max(0, LIMITS.hour.count - w.per_hour.length),
        day: Math.max(0, LIMITS.day.count - w.per_day.length),
      },
    };
  }

  w.per_minute.push(now);
  w.per_hour.push(now);
  w.per_day.push(now);

  return {
    allowed: true,
    remaining: {
      minute: LIMITS.minute.count - w.per_minute.length,
      hour: LIMITS.hour.count - w.per_hour.length,
      day: LIMITS.day.count - w.per_day.length,
    },
  };
}

// Test seam: clear all keys. Not exported in the package's public surface,
// but reachable for tests via direct import.
export function _resetRateLimits(): void {
  windows.clear();
}
